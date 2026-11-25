"""Isolated Thunderbird runtime probe through its Marionette test protocol.

Never use an existing user profile. Run with --exe path/to/thunderbird.exe.
"""
import argparse
import os
import json
from pathlib import Path
import socket
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]

class Marionette:
    def __init__(self, port):
        self.socket = socket.create_connection(("127.0.0.1", port), timeout=10)
        self.sequence = 0
        self.receive()

    def receive(self):
        prefix = b""
        while not prefix.endswith(b":"):
            byte = self.socket.recv(1)
            if not byte:
                raise RuntimeError("Marionette connection closed")
            prefix += byte
        length = int(prefix[:-1])
        data = b""
        while len(data) < length:
            data += self.socket.recv(length - len(data))
        return json.loads(data)

    def call(self, command, args=None):
        self.sequence += 1
        data = json.dumps([0, self.sequence, command, args or {}]).encode()
        self.socket.sendall(str(len(data)).encode() + b":" + data)
        message = self.receive()
        if message[2]:
            raise RuntimeError(json.dumps(message[2], ensure_ascii=False))
        return message[3]

    def script(self, script, args=None):
        return self.call("WebDriver:ExecuteScript", {"script": script, "args": args or [], "newSandbox": False, "sandbox": "system"})

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--exe", required=True)
    parser.add_argument("--profile-name", default="thunderbird-161-profile")
    parser.add_argument("--locale", default="de")
    parser.add_argument("--localization-only", action="store_true")
    args = parser.parse_args()
    profile = ROOT.parent / "test-output" / args.profile_name
    profile.mkdir(parents=True, exist_ok=True)
    preferences = {
        "marionette.enabled": True, "marionette.port": 2829,
        "mail.provider.enabled": False, "mail.shell.checkDefaultClient": False,
        "mail.winsearch.firstRunDone": True, "app.update.auto": False,
        "datareporting.policy.dataSubmissionEnabled": False,
        "toolkit.telemetry.enabled": False, "mailnews.start_page.enabled": False,
        "extensions.webextensions.remote": False,
        "intl.locale.requested": args.locale,
        "mail.account.account1.server": "server1", "mail.accountmanager.accounts": "account1",
        "mail.accountmanager.localfoldersserver": "server1", "mail.server.server1.type": "none",
        "mail.server.server1.hostname": "Local Folders", "mail.server.server1.name": "Local Folders",
        "mail.server.server1.userName": "nobody", "calendar.timezone.local": "Europe/Berlin",
    }
    (profile / "user.js").write_text("\n".join(f"user_pref({json.dumps(k)}, {json.dumps(v)});" for k,v in preferences.items()), encoding="utf-8")
    startup = subprocess.STARTUPINFO()
    startup.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    startup.wShowWindow = 0
    log = open(profile.parent / "thunderbird.log", "w", encoding="utf-8")
    test_env = dict(os.environ, MOZ_REMOTE_ALLOW_SYSTEM_ACCESS="1")
    process = subprocess.Popen([args.exe, "-no-remote", "-headless", "--marionette", "--remote-allow-system-access", "-profile", str(profile)], stdout=log, stderr=log, startupinfo=startup, env=test_env)
    try:
        client = None
        for _ in range(40):
            try:
                client = Marionette(2829)
                break
            except (OSError, RuntimeError):
                time.sleep(.5)
        if client is None:
            raise RuntimeError("Thunderbird Marionette did not start; see test-output/thunderbird.log")
        print(client.call("WebDriver:NewSession", {"capabilities": {"alwaysMatch": {"acceptInsecureCerts": False}}}))
        print(client.call("Marionette:SetContext", {"value": "chrome"}))
        print(client.script("return {version:Services.appinfo.version, windows:[...Services.wm.getEnumerator(null)].map(w=>w.document.documentURI)};"))
        if args.localization_only:
            from localization_cases import run
            run(client, ROOT, args.locale)
        else:
            from runtime_cases import run
            run(client, ROOT)
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
        log.close()

if __name__ == "__main__":
    main()
