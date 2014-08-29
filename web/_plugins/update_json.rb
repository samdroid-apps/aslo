require 'open-uri'
require 'json'

module Jekyll
  class UpdateJsonConverter < Converter
    safe true
    priority :low

    def matches(ext)
      ext =~ /^\.UPDATE_JSON/i
    end

    def output_ext(ext)
      ".json"
    end

    def convert(content)
      activities = {}      

      Dir.glob "./data/*.json" do |path|
        j = JSON.parse open(path).read
        bundle_id = /\.\/data\/(.*).json/.match(path)[1]

        if bundle_id != "featured"
          activities[bundle_id] = {
            "minSugarVersion" => j["minSugarVersion"],
            "version"         => j["version"],
            "xo_url"          => j["xo_url"],
            "xo_size"         => j["xo_size"]
          }
        end
      end

      return {"activities"=>activities}.to_json
    end
  end
end
