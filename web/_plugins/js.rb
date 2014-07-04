LIBS = [
  "./js/lib/jquery.min.js",
  "./js/lib/prefixfree.min.js"
]

module Jekyll
  class JSConverter < Converter
    safe true
    priority :low

    def matches(ext)
      ext =~ /^\.TODO/i
    end

    def output_ext(ext)
      ".js"
    end

    def convert(content)
      all = ""

      LIBS.each do |lib|
        all += File.read lib
      end

      all += File.read "./js/outp.js"

      return all
    end
  end
end
