import asyncio
import base64
import json
import logging
import os.path
import subprocess
from typing import Optional
import shutil

CONFIG_PATH = '/home/deck/.config/OverLaid/config.json'
OVERLAY_PATH = '/home/deck/homebrew/overlays'

logging.basicConfig(filename="/tmp/overlaid.log",
                    format='[OverLaid] %(asctime)s %(levelname)s %(message)s',
                    filemode='a',
                    force=True)
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def expand_path(overlay: str, path: str):
    return path if path.startswith('/') else f'{OVERLAY_PATH}/{overlay}/{path}'


class OverLaidBackend:

    def __init__(self):
        self.proc: Optional[subprocess.Popen] = None
        self.config = None
        self.overlays = []

    def save_config(self):
        with open(CONFIG_PATH, 'w') as f:
            json.dump(self.config, f)

    def load_config(self):
        self.config = {'enabled': {}}
        if os.path.exists(CONFIG_PATH):
            try:
                with open(CONFIG_PATH) as f:
                    self.config.update(json.load(f))
            except Exception as e:
                logger.error('Failed to load config', exc_info=e)
        else:
            self.save_config()

        enabled = {}
        self.overlays = []
        directories = next(os.walk(OVERLAY_PATH))[1]
        for directory in directories:
            overlay = {
                'name': directory,
                'widgets': []
            }
            try:
                with open(f'{OVERLAY_PATH}/{directory}/overlay.json') as f:
                    overlay.update(json.load(f))
                self.overlays.append(overlay)
                enabled[overlay['name']] = self.config['enabled'][overlay['name']] if overlay['name'] in self.config['enabled'] else False
            except Exception as e:
                logger.error('Failed to parse overlay', exc_info=e)
        self.config['enabled'] = dict(sorted(enabled.items()))
        self.overlays = sorted(self.overlays, key=lambda o: o['name'])

    async def create(self):
        if self.proc is not None:
            return
        logger.info('Creating process')

        widgets = []
        for overlay in self.overlays:
            if not self.config['enabled'][overlay['name']]:
                continue
            for w in overlay['widgets']:
                widget = w.copy()
                if widget['type'] == 'image':
                    widget['content'] = expand_path(overlay['name'], widget['content'])
                if widget['type'] == 'image' and not os.path.exists(widget["content"]):
                    logger.warning(f'Invalid image widget: \'{widget["content"]}\'')
                    continue
                widgets.append(widget)

        self.proc = subprocess.Popen(
            ['/home/deck/homebrew/plugins/OverLaid/bin/OverLaid', json.dumps(widgets)],
            env={'DISPLAY': ':0'},
            stdout=subprocess.PIPE
        )

    async def destroy(self):
        if self.proc is None:
            return
        logger.info('Destroying process')
        self.proc.kill()
        output = bytes.decode(self.proc.stdout.read())
        if len(output) > 0:
            logger.info(f'Process finished with output: {output}')
        self.proc = None

    async def get_overlays(self):
        return {'overlays': self.overlays}

    async def delete_overlay(self, overlay):
        shutil.rmtree(f'{OVERLAY_PATH}/{overlay["name"]}')
        self.load_config()

    async def save_overlay(self, overlay):
        os.makedirs(f'{OVERLAY_PATH}/{overlay["name"]}', exist_ok=True)
        with open(f'{OVERLAY_PATH}/{overlay["name"]}/overlay.json', 'w') as f:
            json.dump(overlay, f, indent=4)
        self.load_config()

    async def get_images(self):
        images = {}
        for overlay in self.overlays:
            for widget in overlay['widgets']:
                if widget['type'] == 'image' and len(widget['content']) > 0:
                    try:
                        with open(expand_path(overlay['name'], widget['content']), 'rb') as f:
                            images[widget['content']] = f'data:image/{"png" if widget["content"].endswith(".png") else "jpeg"};base64,{base64.b64encode(f.read()).decode()}'
                    except Exception as e:
                        logger.warning('Failed to load image', exc_info=e)
        return images

    async def get_settings(self):
        return self.config

    async def save_settings(self, settings):
        self.config.update(settings)
        self.save_config()

    async def reload_config(self):
        self.load_config()

    async def _main(self):
        os.makedirs(OVERLAY_PATH, exist_ok=True)
        os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)

        self.load_config()

        logger.info('Started')

        while True:
            if self.proc is not None and (result := self.proc.poll()) is not None:
                logger.error(f'Process died with code: {result}, Output: {bytes.decode(self.proc.stdout.read())}')
                self.proc = None
            await asyncio.sleep(0.1)

    async def _unload(self):
        await self.destroy()


class Plugin:
    ...


plugin = OverLaidBackend()
for attr in dir(OverLaidBackend):
    if not attr.startswith('__') and callable(getattr(plugin, attr)):
        setattr(Plugin, attr, lambda _, func=getattr(plugin, attr), *args, **kwargs: func(*args, **kwargs))
