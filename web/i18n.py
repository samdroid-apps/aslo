import logging
from flask import request

def get_languages():
    '''
    Gets the language based off user's headers

    Returns:
        A list of the user's languages in of preference

    Spec:  http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.4
    '''
    header = request.headers.get('Accept-Language', '')
    if not header:
        return ['en-US', 'en_US']

    languages = []
    for lang in header.split(','):
        if not lang.strip():
            continue

        lang = lang.strip().split(';')
        if len(lang) == 1:
            languages.append((lang[0], 1.0))
        elif len(lang) == 2 and lang[1].startswith('q='):
            try:
                v = float(lang[1].lstrip('q='))
            except ValueError:
                logging.warning('Werid langauge header: %r', header)
                v = 1.0
            languages.append((lang[0], v))
        else:
            logging.warning('Werid langauge header: %r', header)

    languages.sort(key=lambda x: x[1])
    languages.reverse()
    return [l for l, v in languages] + ['en-US', 'en_US']


def get_localized_text(obj):
    '''
    Args:
        obj: dict - map of langauge code to text

    Returns
        a string of text for the current user
    '''
    if obj is None or obj == {}:
        return ''

    languages = get_languages()
    for l in languages:
        if obj.get(l) is not None:
            return obj.get(l)

    base = languages[0][:2]
    for l in obj.iterkeys():
        if l[:2] == base:
            return obj.get(l)

    return obj.get(obj.iterkeys().next())
