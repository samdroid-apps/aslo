import os
import json
import shutil
import unittest
import responses
from mock import Mock
from tempfile import mkdtemp

import main
import i18n
import backend


def setUpModule():
    backend.ACTIVITIES = os.path.join(mkdtemp(), 'a')
    shutil.copytree('test-data', backend.ACTIVITIES)
    backend.cache()

def tearDownModule():
    shutil.rmtree(os.path.dirname(backend.ACTIVITIES))


class TestBackend(unittest.TestCase):
    def test_ALL_BUNDLE_IDS(self):
        self.assertEqual(backend.ALL_BUNDLE_IDS,
                         sorted(['today.sam.test', 'o.sl.test']))

    def test_get_activity(self):
        activity = backend.get_activity('today.sam.test')
        self.assertEqual(activity.get('extended_info'), 'TEST')

    def test_get_basic_activity(self):
        activity = backend.get_basic_activity('today.sam.test')
        self.assertNotIn('extended_info', activity)
        self.assertIn('icon', activity)
        self.assertIn('title', activity)
        self.assertIn('categories', activity)

    def test_featured_icon(self):
        activity = backend.get_basic_activity('today.sam.test')
        self.assertEqual(activity['icon'], backend.FEATURED['te-ST']['icon'])


class Test18n(unittest.TestCase):
    def setUp(self):
        i18n.request = Mock()

    def test_get_language_malformed(self):
        # Should be te-ST;q=1.0
        i18n.request.headers = {'Accept-Language': 'te-ST; q=1.0'}
        self.assertEqual(i18n.get_languages(), ['en-US', 'en_US'])

    def test_get_language_malformed2(self):
        i18n.request.headers = {'Accept-Language': 'LOL;!!!,,;,'}
        self.assertEqual(i18n.get_languages(), ['en-US', 'en_US'])

    def test_get_language_none(self):
        i18n.request.headers = {}
        self.assertEqual(i18n.get_languages(), ['en-US', 'en_US'])

    def test_get_language_single(self):
        i18n.request.headers = {'Accept-Language': 'te-ST'}
        self.assertEqual(i18n.get_languages(), ['te-ST', 'en-US', 'en_US'])

    def test_get_language_many(self):
        # Example from the w3c spec :)
        i18n.request.headers = {'Accept-Language': 'da, en-gb;q=0.8, en;q=0.7'}
        self.assertEqual(i18n.get_languages(),
                         ['da', 'en-gb', 'en', 'en-US', 'en_US'])

    def test_get_text_boring(self):
        i18n.request.headers = {}
        self.assertEqual(i18n.get_localized_text({'en-US': 'yes'}), 'yes')

    def test_get_text_many(self):
        i18n.request.headers = {'Accept-Language': 'da, en-gb;q=0.8, en;q=0.7'}
        self.assertEqual(i18n.get_localized_text(
            {'en-gb': 'yes', 'en': 'no', 'en-US': 'no'}), 'yes')

    def test_get_text_dialect(self):
        i18n.request.headers = {'Accept-Language':
            'es-UY, te-ST;q=0.9, es-ES;q=0.8'}
        self.assertEqual(i18n.get_localized_text(
            {'te-ST': 'yes', 'es-ES': 'no', 'en-US': 'no'}), 'yes')


SOCIALHELP = 'https://use-socialhelp.sugarlabs.org/goto/{}.json'.format


class ServerTestCase(unittest.TestCase):
    def setUp(self):
        self.app = main.app.test_client()

    def test_index_featured(self):
        r = self.app.get('/')
        self.assertEqual(r.status, '200 OK')
        self.assertIn('Coolness', r.data)
        self.assertIn('Sales Pitch', r.data)
        self.assertIn('background: blue', r.data)

    def test_index_activities(self):
        r = self.app.get('/')
        self.assertEqual(r.status, '200 OK')
        self.assertIn('/view/today.sam.test', r.data)
        self.assertIn('Slides', r.data)
        self.assertIn('/view/o.sl.test', r.data)
        self.assertIn('Bibliography', r.data)

    def _assert_got_slides(self, r):
        self.assertEqual(r.status, '200 OK')
        self.assertIn('/view/today.sam.test', r.data)
        self.assertIn('Slides', r.data)
        self.assertNotIn('/view/o.sl.test', r.data)
        self.assertNotIn('Bibliography', r.data)
        self.assertNotIn('no-results', r.data)

    def test_search_query(self):
        r = self.app.get('/search?query=slides')
        self._assert_got_slides(r)

    def test_search_category(self):
        r = self.app.get('/search?category=creative')
        self._assert_got_slides(r)

    def test_search_both(self):
        r = self.app.get('/search?category=creative&query=i')
        self._assert_got_slides(r)

    def test_search_no_results(self):
        r = self.app.get('/search?query=lol')
        self.assertIn('no-results', r.data)

    @responses.activate
    def test_view_metadata(self):
        responses.add(
            responses.GET, SOCIALHELP('o.sl.test'),
            body='{ "success": false }')
        r = self.app.get('/view/o.sl.test')
        self.assertEqual(r.status, '200 OK')
        metadatas = (
            'Sam',
            'https://github.com/samdroid-apps',
            'Need a bibliography?  Bibliography Activity can help you',
            '0.96',
            'Bibliography 2',
            'http://i.imgur.com/e0aYm6B.png',
            ('http://download.sugarlabs.org/activities2/'
             'org.sugarlabs.BibliographyActivity_v2.xo')
        )
        for i in metadatas:
            self.assertIn(i, r.data)

    def test_view_metadata_404(self):
        r = self.app.get('/view/lol.nobody.made.this')
        self.assertEqual(r.status, '404 NOT FOUND')

    @responses.activate
    def test_socialhelp_none(self):
        responses.add(
            responses.GET, SOCIALHELP('o.sl.test'),
            body='{ "success": true, "count": 0 }')
        r = self.app.get('/view/o.sl.test')
        self.assertEqual(r.status, '200 OK')
        self.assertIn('no-comments', r.data)
        self.assertIn('No Comments', r.data)
        self.assertIn(SOCIALHELP('o.sl.test')[:-5], r.data)

    @responses.activate
    def test_socialhelp_some(self):
        responses.add(
            responses.GET, SOCIALHELP('o.sl.test'),
            body='{ "success": true, "count": 1, "data":'
                 '  [{"t": "Title", "s": "slug", "l": 0, "p": 1}] }')
        r = self.app.get('/view/o.sl.test')
        self.assertEqual(r.status, '200 OK')
        self.assertIn('1 Comment', r.data)
        self.assertIn('Title', r.data)
        self.assertIn('slug', r.data)
        self.assertIn(SOCIALHELP('o.sl.test')[:-5], r.data)

    @responses.activate
    def test_socialhelp_plural(self):
        responses.add(
            responses.GET, SOCIALHELP('o.sl.test'),
            body='{ "success": true, "count": 5 }')
        r = self.app.get('/view/o.sl.test')
        self.assertEqual(r.status, '200 OK')
        self.assertIn('5 Comments', r.data)

    def test_update_json(self):
        r = self.app.get('/update.json')
        self.assertEqual(r.status, '200 OK')
        # The sugar client expects these attributes
        d = json.loads(r.data)
        self.assertEqual(len(d), 2)
        i = d['today.sam.test']
        self.assertEqual(i.get('minSugarVersion'), '0.100')
        self.assertEqual(i.get('version'), 2)
        self.assertEqual(i.get('xo_url'), 'http://download.sugarlabs.org/'
                         'activities2/me.samdroid.sugar.slides_v2.xo')
        self.assertEqual(i.get('xo_size'), 27095)

if __name__ == '__main__':
    unittest.main()
