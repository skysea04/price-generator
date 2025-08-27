# 報價單產生器 (Price Generator)

一個基於 React 的報價單產生器，支援拖拽排序、Excel/Google Sheets 數據導入、PDF 匯出等功能。

## 功能特色

- 📋 **Excel/Google Sheets 導入**：直接貼上數據，自動解析並導入
- 🎯 **拖拽排序**：支援服務項目的拖拽排序
- 📄 **PDF 匯出**：生成專業的報價單 PDF
- 💾 **歷史記錄**：自動保存報價單歷史
- 🎨 **自定義 LOGO**：支援客戶 LOGO 上傳
- 📊 **稅率計算**：自動計算稅金和總價

## 技術架構

- **前端框架**: React 19 + TypeScript
- **樣式框架**: Bootstrap 5
- **拖拽功能**: @dnd-kit
- **PDF 生成**: jsPDF + html2canvas
- **部署平台**: GitHub Pages

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### `npm run deploy`

Deploys the app to GitHub Pages.\
This command will:
1. Build the app for production
2. Deploy to the `gh-pages` branch
3. Make it available at: https://yuhsuan.github.io/price-generator-react

## GitHub Pages 部署

### 前置條件
1. 確保你的 GitHub 倉庫名稱為 `price-generator-react`
2. 確保你有該倉庫的寫入權限

### 部署步驟
1. 提交所有更改到 GitHub：
   ```bash
   git add .
   git commit -m "Add GitHub Pages deployment"
   git push origin main
   ```

2. 執行部署命令：
   ```bash
   npm run deploy
   ```

3. 等待部署完成，你的應用程序將在以下地址可用：
   **https://yuhsuan.github.io/price-generator-react**

### 注意事項
- 首次部署可能需要幾分鐘時間
- 如果更改了 `homepage` 設置，需要重新部署
- 部署後可能需要清除瀏覽器緩存

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
