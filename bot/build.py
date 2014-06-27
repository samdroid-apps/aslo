import os
from subprocess import call

def compile_bundle():
    call(['rm', '-r', 'dl/dist'])
    # Common issue
    if not os.path.isdir('dl/po'):
        os.mkdir('dl/po')

    os.chdir('dl')
    call(['python', 'setup.py', 'dist_xo'])
    os.chdir('..')
    
    if os.path.isdir('dl/dist/'):
        f = os.path.join('dl/dist', os.listdir('dl/dist/')[0])
        fo = open(f, 'rb')
        return fo.read().encode('base64')
    return ''
