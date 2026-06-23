export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#C41E3A',       // 球队红（强调色）
        secondary: '#1A3A8A',     // 球队蓝（辅助色）
        'bg-main': '#FAFAFA',     // 暖白背景
        'nav-dark': '#0F0F0F',    // 深色导航栏
        'text-main': '#1A1A1A',   // 主文字
        'text-sub': '#6B7280',    // 次要文字
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
