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
      puts "I hope you ran `git clone https://github.com/samdroid-apps/sugar-activities data`"
      puts "  and you ran `git pull`!"

      activities = {}      

      Dir.glob "./data/*.json" do |path|
        j = JSON.parse open(path).read
        bundle_id = /\.\/data\/(.*).json/.match(path)[1]

        activities[bundle_id] = {
          "categories" => j["categories"],
          "icon"       => j["icon"],
          "title"      => j["title"]
        }
      end

      return {"activities"=>activities}.to_json
    end
  end
end
