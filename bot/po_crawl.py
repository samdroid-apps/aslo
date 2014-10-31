import os

from polib import pofile

# FIXME: base_tag='en-US' assumes the activity is written in English 1st
def get_translations(base, base_tag='en-US'):
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

def get_translation_for_field(cp, field):
    if not cp.has_option('Activity', field):
        return None
    return get_translations(cp.get('Activity', field))
