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
      if not Dir.exists? "./data"
        `git clone https://github.com/samdroid-apps/sugar-activities data`
      else
        Dir.chdir("data"){
          `git pull`
        }
      end

      activities = {}   

      Dir.glob "./data/*.json" do |path|
        j = JSON.parse open(path).read
        bundle_id = /\.\/data\/(.*).json/.match(path)[1]

        if bundle_id != "featured"
          activities[bundle_id] = {
            "categories" => j["categories"],
            "icon"       => j["icon"],
            "title"      => j["title"]
          }
        end
      end

      featured = JSON.parse open("data/featured.json").read

      return {"activities"=>activities,"featured"=>featured}.to_json
    end
  end
end
