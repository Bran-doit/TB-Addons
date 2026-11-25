"""Real Thunderbird test cases. Only uses the runner's isolated profile."""
import json
import time

PRE = """var main=Services.wm.getMostRecentWindow('mail:3pane');
var windows=[...Services.wm.getEnumerator(null)];
var editors=windows.flatMap(w=>[...w.document.querySelectorAll('iframe')]).map(f=>f.contentWindow).filter(w=>w?.calendarItem?.isEvent());
var find=title=>editors.find(w=>w.calendarItem.title===title);
var popup=windows.find(w=>w.document.documentURI==='chrome://messenger/content/extensionPopup.xhtml');
var d=popup?.document.querySelector('browser')?.contentDocument;
"""

def run(client, root):
    report = []
    def js(code):
        return client.script(PRE + code).get("value")
    def check(name, condition, detail=None):
        assert condition, name
        report.append({"test": name, "passed": True, "detail": detail})
        print("PASS", name, detail or "", flush=True)
    def wait(code, seconds=20):
        end = time.monotonic() + seconds
        while time.monotonic() < end:
            result = js(code)
            if result:
                return result
            time.sleep(.2)
        print(js("return {windows:windows.map(w=>({uri:w.document.documentURI,title:w.document.title,frames:[...w.document.querySelectorAll('iframe')].map(f=>({src:f.getAttribute('src'),uri:f.contentDocument?.documentURI,ready:f.contentDocument?.readyState,title:f.contentWindow?.calendarItem?.title,button:!!f.contentDocument?.querySelector('.osm-address-button')}))})),errors:Services.console.getMessageArray().map(m=>m.message).slice(-15)};"),flush=True)
        raise AssertionError("Timed out: " + code)
    def create(title, location, tab=False):
        return js("""
          var {cal}=ChromeUtils.importESModule('resource:///modules/calendar/calUtils.sys.mjs');
          var {CalEvent}=ChromeUtils.importESModule('resource:///modules/CalEvent.sys.mjs');
          Services.prefs.setBoolPref('calendar.item.editInTab', TAB);
          var calendar=cal.manager.getCalendars().find(c=>c.type==='storage');
          if(!calendar){calendar=cal.manager.createCalendar('storage',Services.io.newURI('moz-storage-calendar://'));calendar.name='OSM test';cal.manager.registerCalendar(calendar);}
          calendar.setProperty('disabled',false);calendar.readOnly=false;
          var event=new CalEvent();event.calendar=calendar;event.title=TITLE;
          event.startDate=cal.dtz.now();event.endDate=event.startDate.clone();event.endDate.hour++;
          event.setProperty('LOCATION',ADDRESS_VALUE);
          main.createEventWithDialog(calendar,null,null,null,event);return true;
        """.replace("TAB", json.dumps(tab)).replace("TITLE", json.dumps(title)).replace("ADDRESS_VALUE", json.dumps(location)))

    # Open before installation to verify initial enumeration of existing editors.
    create("OSM A", "Unter den Linden 6 Berlin")
    wait("return !!find('OSM A')?.document.getElementById('item-location');")
    version=json.loads((root/'manifest.json').read_text(encoding='utf-8'))['version']
    client.call("Addon:Install", {"path": str(root / f"build/osm-address-lookup-{version}.xpi"), "temporary": True})
    check("Already open editor receives button", wait("return !!find('OSM A')?.document.querySelector('.osm-address-button');"))
    create("OSM B", "")
    check("New editor receives button", wait("return !!find('OSM B')?.document.querySelector('.osm-address-button');"))
    check("Button is immediately to the right", js("var f=find('OSM A').document.getElementById('item-location');var b=f.nextElementSibling;return b.classList.contains('osm-address-button')&&b.getBoundingClientRect().left>=f.getBoundingClientRect().right;"))
    js("find('OSM B').document.querySelector('.osm-address-button').click();")
    wait("return d?.getElementById('status')?.textContent.includes('Suchvorschlag');")
    check("Title suggestion stays local until search", js("return d.getElementById('query').value==='OSM B'&&d.querySelectorAll('.result').length===0&&d.getElementById('apply').disabled;"))
    js("d.getElementById('cancel').click();")
    wait("return !popup;")
    check("Cancel preserves empty location", js("return find('OSM B').document.getElementById('item-location').value==='';"))
    js("find('OSM A').document.querySelector('.osm-address-button').click();")
    wait("return d?.getElementById('query')?.value==='Unter den Linden 6 Berlin';")
    check("Existing location is transferred", True)
    check("Opening a populated location sends no search", js("return d.querySelectorAll('.result').length===0&&!d.getElementById('search').disabled;"))
    js("d.getElementById('search').click();")
    wait("return d?.querySelectorAll('.result').length>0||d?.getElementById('status')?.classList.contains('error');", 25)
    check("Live Photon search returns results", js("return d.querySelectorAll('.result').length>0;"), js("return d.getElementById('status').textContent;"))
    check("No result selected automatically", js("return d.getElementById('apply').disabled;"))
    expected = js("d.querySelector('input[type=radio]').click();return d.getElementById('preview').textContent.replace(/^Übernahme: /,'');")
    js("d.getElementById('apply').click();")
    wait("return !popup;")
    check("Apply writes only the selected editor", js("return find('OSM A').document.getElementById('item-location').value;")==expected and js("return find('OSM B').document.getElementById('item-location').value;")=="", expected)
    check("Thunderbird detects unsaved change", js("return find('OSM A').isItemChanged() && !find('OSM A').calendarItem.id;"))
    # Save through Thunderbird's real command, then reopen its actual stored item.
    js("find('OSM A').onCommandSave(false);")
    wait("return !!find('OSM A')?.calendarItem.id;")
    js("main._osmSaved=find('OSM A').calendarItem;find('OSM A').top.close();")
    wait("return !find('OSM A');")
    js("main.modifyEventWithDialog(main._osmSaved,false);")
    wait("return !!find('OSM A')?.document.querySelector('.osm-address-button');")
    check("Save and reopen preserves address", js("return find('OSM A').document.getElementById('item-location').value;")==expected)
    js("find('OSM A').document.querySelector('.osm-address-button').click();")
    wait("return !!d?.getElementById('query')?.value;")
    js("d.getElementById('search').click();")
    wait("return d?.querySelectorAll('.result').length>0;", 25)
    js("d.querySelector('input[type=radio]').click();find('OSM A').document.getElementById('item-location').value='Manual change';d.getElementById('apply').click();")
    wait("return d?.getElementById('status')?.textContent.includes('inzwischen');")
    check("Concurrent location edits are protected", js("return find('OSM A').document.getElementById('item-location').value==='Manual change';"))
    js("d.getElementById('cancel').click();")
    wait("return !popup;")
    create("OSM Tab", "", True)
    check("Editor in tab receives button", wait("return !!find('OSM Tab')?.document.querySelector('.osm-address-button');"))
    js("var e=find('OSM B');e.document.getElementById('item-location').disabled=true;")
    check("Read-only field disables lookup", wait("return find('OSM B').document.querySelector('.osm-address-button').disabled;"))
    create("10-13 Uhr TdA ev. GS Potsdam Babelsberg Kopf, Herz & Hand", "")
    wait("return !!find('10-13 Uhr TdA ev. GS Potsdam Babelsberg Kopf, Herz & Hand')?.document.querySelector('.osm-address-button');")
    js("editors.find(e=>e.calendarItem.title.startsWith('10-13')).document.querySelector('.osm-address-button').click();")
    wait("return d?.getElementById('status')?.textContent.includes('Suchvorschlag');")
    check("School title is prepared locally", js("return d.getElementById('query').value==='Evangelische Grundschule Potsdam Babelsberg Kopf Herz Hand'&&d.querySelectorAll('.result').length===0;"))
    js("d.getElementById('search').click();")
    wait("return d?.querySelectorAll('.result').length>0;", 55)
    check("School found by name with visible adapted query", js("return d.getElementById('status').textContent.includes('Gesucht nach:')&&[...d.querySelectorAll('.result')].some(e=>e.textContent.includes('Rudolf-Breitscheid'));"))
    js("[...d.querySelectorAll('.result')].find(e=>e.textContent.includes('Rudolf-Breitscheid')).querySelector('input').click();d.getElementById('apply').click();")
    wait("return !popup;")
    check("School address transferred without changing title", js("return editors.find(e=>e.calendarItem.title==='10-13 Uhr TdA ev. GS Potsdam Babelsberg Kopf, Herz & Hand').document.getElementById('item-location').value==='Rudolf-Breitscheid-Straße 21, 14482 Potsdam';"))
    client.call("Addon:Uninstall", {"id": "osm-address-lookup@local.invalid"})
    check("Uninstall removes all injected buttons", wait("return editors.every(e=>!e.document.querySelector('.osm-address-button'));"))
    runtime_version=js("return Services.appinfo.version;")
    out=root / f"docs/runtime-results-{runtime_version}.json"
    out.write_text(json.dumps({"thunderbird":js("return Services.appinfo.version;"),"addonVersion":version,"mode":"headless, isolated profile, extensions.webextensions.remote=false", "tests":report}, ensure_ascii=False, indent=2)+"\n",encoding="utf-8")
