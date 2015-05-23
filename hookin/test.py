import json
import unittest
import responses
from mock import Mock

import main
from backend import _INVALID_BUNDLE_ERROR


GITHUB_FILE = ('https://raw.githubusercontent.com/{}'
               '/master/{}').format


class ServerTestCase(unittest.TestCase):
    def setUp(self):
        main.app.config['TESTING'] = True
        self.app = main.app.test_client()

        self._fedmsg = main.hook_call_to_bus.func_globals['fedmsg']
        self._fedmsg.publish = Mock()

    @responses.activate
    def test_good_from_url(self):
        responses.add(
            responses.GET,
            GITHUB_FILE('sugarlabs/browse-activity', 'activity/activity.info'),
            body='bundle_id = org.laptop.WebActivity')
        r = self.app.get('/hook/sugarlabs/browse-activity')
        self.assertEqual(r.status, '200 OK')

        self._fedmsg.publish.assert_called_with(
            modname='hookin', topic='hookS',
            msg={'clone_url': 'https://github.com/sugarlabs/browse-activity',
                 'bundle_id':  'org.laptop.WebActivity'})

    @responses.activate
    def test_bad_from_url(self):
        responses.add(
            responses.GET,
            GITHUB_FILE('sugarlabs/browse-activity', 'activity/activity.info'),
            body='bundle_id = evil.not.really.browse')
        r = self.app.get('/hook/sugarlabs/browse-activity')
        self.assertEqual(r.status, '200 OK')

        self._fedmsg.publish.assert_called_with(
            modname='hookin', topic='hookS',
            msg={'clone_url': 'https://github.com/sugarlabs/browse-activity',
                 'info':  _INVALID_BUNDLE_ERROR})

    @responses.activate
    def test_not_activity_from_url(self):
        responses.add(
            responses.GET,
            GITHUB_FILE('sugarlabs/sugar', 'activity/activity.info'),
            status=404)
        r = self.app.get('/hook/sugarlabs/sugar')
        self.assertEqual(r.status, '200 OK')

        self._fedmsg.publish.assert_called_with(
            modname='hookin', topic='hookS',
            msg={'clone_url': 'https://github.com/sugarlabs/sugar'})

    @responses.activate
    def test_good_from_body(self):
        responses.add(
            responses.GET,
            GITHUB_FILE('sugarlabs/browse-activity', 'activity/activity.info'),
            body='bundle_id = org.laptop.WebActivity')
        payload = {'repository': {'full_name': 'sugarlabs/browse-activity'}}
        r = self.app.post('/hook/', data=json.dumps(payload),
                          headers={'Content-Type': 'application/json'})
        self.assertEqual(r.status, '200 OK')

        self._fedmsg.publish.assert_called_with(
            modname='hookin', topic='hookS',
            msg={'clone_url': 'https://github.com/sugarlabs/browse-activity',
                 'bundle_id':  'org.laptop.WebActivity'})

    @responses.activate
    def test_pull(self):
        os = main.hook_call_to_bus.func_globals['os']
        os.system = Mock()

        responses.add(
            responses.GET, GITHUB_FILE('samdroid-apps/sugar-activities',
                                       'activity/activity.info'),
            status=404)
        r = self.app.get('/hook/samdroid-apps/sugar-activities')
        self.assertEqual(r.status, '200 OK')
        os.system.assert_called_with('git pull origin master')



if __name__ == '__main__':
    unittest.main()
