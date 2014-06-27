module Jekyll
  class ActivityTag < Liquid::Tag

    def initialize(tag_name, text, tokens)
      super
      # The data is [name, id, icon, bg]
      list = text.split ' '
      @data = {
        :name => list[0],
        :id   => list[1],
        :icon => list[2],
        :bg   => list[3]
      }
    end

    def render(context)
      "<div class='activity-bg no-c' style='background: #{ @data[:bg] }'>
        <div class='activity'>
          <a class='no-style' href='/#!/view/#{ @data[:id] }'>
            <img src='#{ @data[:icon] }'/>
            <h3>#{ @data[:name] }</h3>
          </a>
        </div>
</div>"
    end
  end
end

Liquid::Template.register_tag('activity', Jekyll::ActivityTag)
