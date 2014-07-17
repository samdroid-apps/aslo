require 'open-uri'
require 'json'

module Jekyll
  class DownloadConverter < Converter
    safe true
    priority :low

    def matches(ext)
      ext =~ /^\.DOWNLOAD/i
    end

    def output_ext(ext)
      ".json"
    end

    def convert(content)
      f = open 'http://aslo-bot-master.sugarlabs.org/data.json'

      # The server pretty prints the json - but
      # we want it compressed
      j = JSON.parse f.read
      return j.to_json
    end
  end
end
