# How to Make a Translation

> **Pro Tip**: Look at `example.json`

First open the file for your language, using a text editor (eg: gedit).  The
convention is naming them `language-COUNTRY.json` (eg: `en-AU.json`).

> **Not a file for your language?**
>
> Open up your text editor (eg: gedit).  Insert the folowing:
>
>     {
>     "I like this": "Saya suka ini"
>     }
>
> And then add your translations!

So then there are 4 steps to add a translation

1. Copy the template into the file (after the `{`):
   `"TEXT": "TRANSLATION"`

2. Copy and paste the English text from the ASLO website (and replace `TEXT`)

3. Replace `TRANSLATION` with the translation

4. If there is not the last line in the file before the `}`, put a comma at the
   very end of the line (eg: `"I like this": "Saya suka ini",`)

> **Pro Tip**:
> Save the file :)
