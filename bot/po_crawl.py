import re
import os

from polib import pofile

# FIXME: base_tag='en_US'
def get_translations(base, base_tag='en_US'):
    results = {base_tag: base}
    if not os.path.isdir('dl/po'):
        return results

    # fileobj, i18n tag
    files = [(pofile(os.path.join('dl/po', i)), i[:-3]) \
             for i in os.listdir('dl/po') if i.endswith('.po')]
    for i in files:
        e = [e for e in i[0].translated_entries() if e.msgid == base]
        if e:
            tag = i[1].replace('_', '-')
            results[tag] = e[0].msgstr

    return results

def get_translation_from_regex(regex, text):
    r = regex.search(text)
    if r:
        return get_translations(r.group(1))
    return None
