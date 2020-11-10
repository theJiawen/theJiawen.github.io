let app;
function start() {
  app = new MyVue({
    el: "#app",
    data: function() {
      return {
        name: "Christina",
        age: 21,
        height: 167,
        description: "An insteresting girl",
        bestFriend: {
          name: "Caren",
          age: 12,
          link: "http://laijiawen.com/"
        },
        不要点我: "你不乖哦:)" // 皮这一下觉得很开心
      };
    },
    computed: {
      // 十年后的年龄 （= =）
      ageAfter10Years() {
        return this.age + 10;
      },

      // 二十年后的年龄 (= =)
      ageAfter20Years: {
        get() {
          return this.age + 20;
        },
        set(val) {
          // 二十年后的年龄变了，说明现在的年龄也变了
          this.age = val - 20;
        }
      }
    },
    methods: {
      aYearPassed() {
        this.age++;
      }
    }
  });
}
