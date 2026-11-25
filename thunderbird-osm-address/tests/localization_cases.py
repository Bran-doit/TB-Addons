"""Localization smoke test in the real Thunderbird runtime."""
import json
import time
from runtime_cases import PRE

def run(client, root, locale):
    english = locale.startswith('en')
    def js(code): return client.script(PRE+code).get('value')
    def wait(code):
        for _ in range(100):
            result=js(code)
            if result: return result
            time.sleep(.2)
        raise AssertionError(code)
    version=json.loads((root/'manifest.json').read_text(encoding='utf-8'))['version']
    client.call('Addon:Install', {'path':str(root/f'build/osm-address-lookup-{version}.xpi'),'temporary':True})
    js("""
      var {cal}=ChromeUtils.importESModule('resource:///modules/calendar/calUtils.sys.mjs');
      var {CalEvent}=ChromeUtils.importESModule('resource:///modules/CalEvent.sys.mjs');
      Services.prefs.setBoolPref('calendar.item.editInTab',false);
      var calendar=cal.manager.getCalendars().find(c=>c.type==='storage');
      calendar.setProperty('disabled',false);calendar.readOnly=false;
      var item=new CalEvent();item.title='Language test';item.calendar=calendar;
      item.startDate=cal.dtz.now();item.endDate=item.startDate.clone();item.endDate.hour++;
      main.createEventWithDialog(calendar,null,null,null,item);
    """)
    label=wait("return find('Language test')?.document.querySelector('.osm-address-button')?.textContent;")
    assert label == ('Find address' if english else 'Adresse suchen'), label
    js("find('Language test').document.querySelector('.osm-address-button').click();")
    wait("return d?.getElementById('query')?.value==='Language test';")
    labels=js("return {lang:d.documentElement.lang, apply:d.getElementById('apply').textContent, search:d.getElementById('search').textContent, privacy:d.getElementById('privacy').textContent, error:d.defaultView.wrappedJSObject.browser.i18n.getMessage('readonly')};")
    assert labels['apply']==('Use address' if english else 'Übernehmen'),labels
    assert labels['search']==('Search and send' if english else 'Suchen und senden'),labels
    assert labels['error']==('The event is read-only.' if english else 'Der Termin ist schreibgeschützt.'),labels
    js("d.getElementById('settings').click();")
    options="function docs(doc){return [doc,...[...doc.querySelectorAll('*')].flatMap(b=>{try{return [...(b.contentDocument?docs(b.contentDocument):[]),...(b.shadowRoot?docs(b.shadowRoot):[])];}catch{return [];}})];} var options=windows.flatMap(w=>docs(w.document)).find(d=>d?.documentURI?.includes('/options/options.html'));"
    wait(options+"return options?.getElementById('endpoint')?.value;")
    text=js(options+"return {heading:options.querySelector('h1').textContent,country:options.querySelector('option[value=DE]').textContent};")
    assert text['heading']==('Settings' if english else 'Einstellungen'),text
    assert text['country']==('Germany' if english else 'Deutschland'),text
    about=js(options+"return {title:options.querySelector('[data-i18n=aboutTitle]').textContent,description:options.querySelector('[data-i18n=aboutDescription]').textContent,privacy:options.querySelector('[data-i18n=aboutPrivacy]').textContent,manifest:options.defaultView.wrappedJSObject.browser.runtime.getManifest(),embedded:options.defaultView.frameElement!==null};")
    assert about['title']==('About OSM Address Lookup' if english else 'Über OSM Address Lookup'),about
    assert 'Photon' in about['description'] and len(about['description'])>150,about
    assert about['manifest']['options_ui']['open_in_tab'] is True,about
    assert 'OpenStreetMap' in about['manifest']['description'],about
    text['about']=about
    map_result = None
    if not english:
        js(options+"options.getElementById('map').checked=true;options.querySelector('button[type=submit]').click();")
        wait(options+"return options.getElementById('status').textContent.includes('gespeichert');")
        js("d.getElementById('cancel').click();")
        wait("return !popup;")
        js("""
          main._osmTileHeaders=[];
          main._osmTileObserver={observe(subject){
            var channel=subject.QueryInterface(Ci.nsIHttpChannel);
            if(channel.URI.host==='tile.openstreetmap.org') main._osmTileHeaders.push(channel.getRequestHeader('User-Agent'));
          }};
          Services.obs.addObserver(main._osmTileObserver,'http-on-modify-request');
          find('Language test').document.querySelector('.osm-address-button').click();
        """)
        wait("return d?.getElementById('query')?.value==='Language test';")
        js("d.getElementById('query').value='Berlin';d.getElementById('query').dispatchEvent(new d.defaultView.Event('input'));d.getElementById('search').click();")
        wait("return d?.querySelector('input[type=radio]');")
        js("d.querySelector('input[type=radio]').click();")
        wait("return d.querySelectorAll('.map-tiles img').length>0&&[...d.querySelectorAll('.map-tiles img')].every(i=>i.naturalWidth===256);")
        map_result=js("return {tiles:d.querySelectorAll('.map-tiles img').length,headers:main._osmTileHeaders,frames:d.querySelectorAll('iframe').length,attribution:d.querySelector('.map-attribution').textContent};")
        assert map_result['headers'] and all(h.startswith('OSMAddressLookup/') for h in map_result['headers']), map_result
        assert map_result['frames']==0 and 'OpenStreetMap' in map_result['attribution'],map_result
        js("Services.obs.removeObserver(main._osmTileObserver,'http-on-modify-request');")
        js(options+"options.getElementById('map').checked=false;options.querySelector('button[type=submit]').click();")
    (root/'docs'/f'localization-{js("return Services.appinfo.version;")}-{locale}.json').write_text(json.dumps({'version':version,'requestedLocale':locale,'thunderbird':js('return Services.appinfo.version;'),'button':label,'dialog':labels,'options':text,'map':map_result,'passed':True},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('PASS real Thunderbird localization',locale,flush=True)
    client.call('Addon:Uninstall', {'id':'osm-address-lookup@local.invalid'})
