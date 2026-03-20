import React, { useState, useEffect } from 'react'
import { 
  History as HistoryIcon, 
  Trash2, 
  Download, 
  Eye, 
  Calendar,
  Image as ImageIcon,
  Clock,
  FileImage,
  X
} from 'lucide-react'

export interface HistoryItem {
  id: string
  timestamp: number
  originalImage: string // Data URL
  processedImage: string // Data URL
  fileName: string
  fileSize: string
  format: 'png' | 'jpg'
  processingTime: number // 毫秒
}

interface HistoryProps {
  onSelectItem?: (item: HistoryItem) => void
  onClearHistory?: () => void
}

const History: React.FC<HistoryProps> = ({ onSelectItem, onClearHistory }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)

  // 加载历史记录
  useEffect(() => {
    const saved = localStorage.getItem('quickbg-history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (error) {
        console.error('加载历史记录失败:', error)
      }
    }
  }, [])

  // 保存历史记录
  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items)
    localStorage.setItem('quickbg-history', JSON.stringify(items))
  }

  // 添加历史记录
  const addHistoryItem = (item: Omit<HistoryItem, 'id'>) => {
    const newItem = {
      ...item,
      id: Date.now().toString()
    }
    
    const newHistory = [newItem, ...history.slice(0, 49)] // 最多保存50条
    saveHistory(newHistory)
  }

  // 删除单条记录
  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newHistory = history.filter(item => item.id !== id)
    saveHistory(newHistory)
    
    if (selectedItem?.id === id) {
      setSelectedItem(null)
    }
  }

  // 清空历史
  const clearHistory = () => {
    if (window.confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
      saveHistory([])
      setSelectedItem(null)
      if (onClearHistory) {
        onClearHistory()
      }
    }
  }

  // 下载历史图片
  const downloadItem = (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const link = document.createElement('a')
    link.href = item.processedImage
    link.download = `quickbg-${new Date(item.timestamp).toISOString().slice(0, 10)}.${item.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - timestamp
    
    // 今天
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    
    // 昨天
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天'
    }
    
    // 一周内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      return `${days}天前`
    }
    
    // 更早
    return date.toLocaleDateString('zh-CN')
  }

  // 格式化处理时间
  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <>
      {/* 历史按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center z-40"
        aria-label="历史记录"
      >
        <HistoryIcon className="w-6 h-6" />
        {history.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {history.length > 9 ? '9+' : history.length}
          </span>
        )}
      </button>

      {/* 历史面板 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* 头部 */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                    <HistoryIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">处理历史</h2>
                    <p className="text-gray-500">
                      共 {history.length} 条记录 • 自动保存到本地
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      清空历史
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-medium hover:from-gray-700 hover:to-gray-800 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>

            <div className="flex h-[calc(90vh-140px)]">
              {/* 左侧：历史列表 */}
              <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                {history.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileImage className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无历史记录</h3>
                    <p className="text-gray-500">
                      处理过的图片将自动保存到这里
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedItem?.id === item.id ? 'bg-purple-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* 缩略图 */}
                          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={item.originalImage}
                              alt="缩略图"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* 信息 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-gray-800 truncate">
                                  {item.fileName}
                                </h4>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatTime(item.timestamp)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatProcessingTime(item.processingTime)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => downloadItem(item, e)}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="下载"
                                >
                                  <Download className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                  onClick={(e) => deleteItem(item.id, e)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                  title="删除"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                            
                            {/* 标签 */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                {item.format.toUpperCase()}
                              </span>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                {item.fileSize}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 右侧：预览区域 */}
              <div className="w-2/3 p-6 overflow-y-auto">
                {selectedItem ? (
                  <div className="space-y-6">
                    {/* 头部 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {selectedItem.fileName}
                        </h3>
                        <p className="text-gray-500">
                          {new Date(selectedItem.timestamp).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => onSelectItem?.(selectedItem)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        查看详情
                      </button>
                    </div>

                    {/* 图片对比 */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <h4 className="font-semibold text-gray-700">原图</h4>
                        </div>
                        <div className="rounded-xl overflow-hidden border-2 border-gray-200">
                          <img
                            src={selectedItem.originalImage}
                            alt="原图"
                            className="w-full h-64 object-contain"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <h4 className="font-semibold text-gray-700">处理后</h4>
                        </div>
                        <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
                          <img
                            src={selectedItem.processedImage}
                            alt="处理后"
                            className="w-full h-64 object-contain"
                          />
                          {/* 网格背景 */}
                          <div 
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              backgroundImage: `
                                linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                                linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                                linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                                linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                              `,
                              backgroundSize: '20px 20px',
                              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 详细信息 */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-700 mb-3">详细信息</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">文件名称</div>
                          <div className="font-medium">{selectedItem.fileName}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">文件大小</div>
                          <div className="font-medium">{selectedItem.fileSize}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">输出格式</div>
                          <div className="font-medium">{selectedItem.format.toUpperCase()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">处理时间</div>
                          <div className="font-medium">{formatProcessingTime(selectedItem.processingTime)}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-sm text-gray-500">处理时间</div>
                          <div className="font-medium">
                            {new Date(selectedItem.timestamp).toLocaleString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => downloadItem(selectedItem, { stopPropagation: () => {} } as any)}
                        className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        下载图片
                      </button>
                      
                      <button
                        onClick={() => {
                          if (onSelectItem) {
                            onSelectItem(selectedItem)
                            setIsOpen(false)
                          }
                        }}
                        className="flex-1 py-3 border border-purple-300 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-5 h-5" />
                        在主界面查看
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">选择历史记录</h3>
                    <p className="text-gray-500 max-w-md">
                      从左侧列表中选择一条历史记录，查看处理前后的图片对比和详细信息
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// 导出添加历史记录的函数
export const addToHistory = (item: Omit<HistoryItem, 'id'>) => {
  const saved = localStorage.getItem('quickbg-history')
  let history: HistoryItem[] = []
  
  if (saved) {
    try {
      history = JSON.parse(saved)
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
  }
  
  const newItem: HistoryItem = {
    ...item,
    id: Date.now().toString()
  }
  
  const newHistory = [newItem, ...history.slice(0, 49)]
  localStorage.setItem('quickbg-history', JSON.stringify(newHistory))
}

export default History