from concurrent.futures import ThreadPoolExecutor
import json
import math
import time
from colorama import Fore, Style
import requests


class Proxy:
    def get_proxies(self):
        proxy_sources = [
            'https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=http&proxy_format=ipport&format=text&timeout=20000',
            'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
            'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies_anonymous/http.txt',
            'https://raw.githubusercontent.com/Vann-Dev/proxy-list/main/proxies/http.txt',
            'https://raw.githubusercontent.com/elliottophellia/yakumo/master/results/http/global/http_checked.txt'
        ]
        all_proxies = set()

        for url in proxy_sources:
            try:
                response = requests.get(url=url)
                response.raise_for_status()
                proxies = response.text.strip().splitlines()
                all_proxies.update(proxies)
            except (ValueError, json.JSONDecodeError, requests.RequestException) as e:
                print(f"🍓 {Fore.RED+Style.BRIGHT}[ {e} ]")
                return False

        sorted_proxies = sorted(all_proxies)
        print(f"🧬 {Fore.GREEN + Style.BRIGHT}[ Generated {len(sorted_proxies)} Proxies ]")
        return sorted_proxies

    def is_proxy_live(self, proxy):
        url = 'http://httpbin.org/ip'
        proxies = {
            'http': f'http://{proxy}',
            'https': f'http://{proxy}'
        }
        try:
            response = requests.get(url=url, proxies=proxies, timeout=5)
            response.raise_for_status()
            return True
        except (ValueError, json.JSONDecodeError, requests.RequestException):
            return False

    def test_proxies(self, proxies):
        live_proxies = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(self.is_proxy_live, proxies))
            live_proxies = [proxy for proxy, is_live in zip(proxies, results) if is_live]
        return live_proxies

    def get_live_proxies(self):
        proxies = self.get_proxies()
        if not proxies:
            return []

        estimated_time = math.ceil(len(proxies) / 10)
        print(f"🔄 {Fore.YELLOW + Style.BRIGHT}[ Estimated Time Checking Proxies {estimated_time} Seconds ]")

        live_proxies = self.test_proxies(proxies)
        print(f"🟢 {Fore.GREEN + Style.BRIGHT}[ Found {len(live_proxies)} Live Proxies ]")
        return live_proxies