import React from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import FilePane from './components/FilePane'
import PreviewPane from './components/PreviewPane'

export default function App() {
  return (
    <div className="app-root">
      <Header />
      <main className="app-main">
        <Sidebar />
        <section className="workspace">
          <FilePane />
          <PreviewPane />
        </section>
      </main>
    </div>
  )
}
