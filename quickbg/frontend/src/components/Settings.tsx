import React, { useState } from 'react'
import { Settings as SettingsIcon, Save, RotateCcw, Moon, Sun, Globe } from 'lucide-react'

interface SettingsProps {
  onSettingsChange?: (settings: AppSettings) => void
}

export interface AppSettings {
  // 处理选项
  processing: {
    format: 'png' | 'jpg'
    quality: number
    removeShadow: boolean
    enhanceEdges: boolean
    autoCrop: boolean
  }
  
  // UI选项
  ui: {
    theme: 'light' | 'dark' | 'auto'
    language: 'zh' | 'en'
    animationSpeed: 'fast' | 'normal' | 'slow'
    showTutorial: boolean
  }
  
  // 高级选项
  advanced: {
    apiEndpoint: string
    useMockApi: boolean
    debugMode: boolean
    saveHistory: boolean
  }
}

const defaultSettings: AppSettings = {
  processing: {
    format: 'png',
    quality: 100,
    removeShadow: true,
    enhanceEdges: false,
    autoCrop: false
  },
  ui: {
    theme: 'auto',
    language: 'zh',
    animationSpeed: 'normal',
    showTutorial: true
  },
  advanced: {
    apiEndpoint: import.meta.env.VITE_API_URL || 'http://localhost:8787',
    useMockApi: true,
    debugMode: false,
    saveHistory: true
  }
}

const Settings: React.FC<SettingsProps> = ({ onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('quickbg-settings')
    return saved ? JSON.parse(saved) : defaultSettings
  })
  const [activeTab, setActiveTab] = useState<'processing' | 'ui' | 'advanced'>('processing')

  const handleSettingChange = <K extends keyof AppSettings>(
    category: K,
    key: keyof AppSettings[K],
    value: any
  ) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    }
    
    setSettings(newSettings)
    localStorage.setItem('quickbg-settings', JSON.stringify(newSettings))
    
    if (onSettingsChange) {
      onSettingsChange(newSettings)
    }
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    localStorage.setItem('quickbg-settings', JSON.stringify(defaultSettings))
    
    if (onSettingsChange) {
      onSettingsChange(defaultSettings)
    }
  }

  const handleSave = () => {
    localStorage.setItem('quickbg-settings', JSON.stringify(settings))
    setIsOpen(false)
    
    if (onSettingsChange) {
      onSettingsChange(settings)
    }
  }

  return (
    <>
      {/* 设置按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center z-40"
        aria-label="设置"
      >
        <SettingsIcon className="w-6 h-6" />
      </button>

      {/* 设置面板 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* 头部 */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                    <SettingsIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">设置</h2>
                    <p className="text-gray-500">自定义QuickBG体验</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    重置
                  </button>
                  
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                </div>
              </div>
            </div>

            {/* 标签页 */}
            <div className="border-b border-gray-200">
              <div className="flex">
                {[
                  { id: 'processing', label: '处理选项', icon: '⚡' },
                  { id: 'ui', label: '界面设置', icon: '🎨' },
                  { id: 'advanced', label: '高级设置', icon: '🔧' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-4 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 内容区域 */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* 处理选项 */}
              {activeTab === 'processing' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">输出设置</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          图片格式
                        </label>
                        <div className="flex gap-2">
                          {(['png', 'jpg'] as const).map((format) => (
                            <button
                              key={format}
                              onClick={() => handleSettingChange('processing', 'format', format)}
                              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                                settings.processing.format === format
                                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {format.toUpperCase()}
                              <div className="text-xs opacity-70 mt-1">
                                {format === 'png' ? '透明背景' : '白色背景'}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {settings.processing.format === 'jpg' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            图片质量: {settings.processing.quality}%
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={settings.processing.quality}
                            onChange={(e) => handleSettingChange('processing', 'quality', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>较小文件</span>
                            <span>最佳质量</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">处理选项</h3>
                    
                    <div className="space-y-3">
                      {[
                        { key: 'removeShadow', label: '去除阴影', description: '自动检测并去除图片中的阴影效果' },
                        { key: 'enhanceEdges', label: '边缘增强', description: '增强主体边缘，使去除效果更清晰' },
                        { key: 'autoCrop', label: '自动裁剪', description: '自动裁剪图片空白区域，优化输出尺寸' }
                      ].map((option) => (
                        <div key={option.key} className="flex items-start">
                          <input
                            type="checkbox"
                            id={option.key}
                            checked={settings.processing[option.key as keyof typeof settings.processing] as boolean}
                            onChange={(e) => handleSettingChange('processing', option.key as any, e.target.checked)}
                            className="mt-1 h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <label htmlFor={option.key} className="ml-3">
                            <div className="font-medium text-gray-700">{option.label}</div>
                            <div className="text-sm text-gray-500">{option.description}</div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 界面设置 */}
              {activeTab === 'ui' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">主题设置</h3>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {(['light', 'dark', 'auto'] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => handleSettingChange('ui', 'theme', theme)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            settings.ui.theme === theme
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            {theme === 'light' ? (
                              <Sun className="w-6 h-6 text-yellow-500" />
                            ) : theme === 'dark' ? (
                              <Moon className="w-6 h-6 text-gray-700" />
                            ) : (
                              <div className="relative">
                                <Sun className="w-6 h-6 text-yellow-500" />
                                <Moon className="w-4 h-4 text-gray-700 absolute -bottom-1 -right-1" />
                              </div>
                            )}
                            <span className="font-medium capitalize">{theme}</span>
                            <span className="text-xs text-gray-500">
                              {theme === 'auto' ? '跟随系统' : theme === 'light' ? '浅色' : '深色'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">语言</h3>
                    
                    <div className="flex gap-2">
                      {(['zh', 'en'] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleSettingChange('ui', 'language', lang)}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                            settings.ui.language === lang
                              ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Globe className="w-4 h-4" />
                          {lang === 'zh' ? '中文' : 'English'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">动画速度</h3>
                    
                    <div className="flex gap-2">
                      {(['fast', 'normal', 'slow'] as const).map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSettingChange('ui', 'animationSpeed', speed)}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                            settings.ui.animationSpeed === speed
                              ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {speed === 'fast' ? '快速' : speed === 'normal' ? '正常' : '慢速'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="showTutorial"
                      checked={settings.ui.showTutorial}
                      onChange={(e) => handleSettingChange('ui', 'showTutorial', e.target.checked)}
                      className="mt-1 h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="showTutorial" className="ml-3">
                      <div className="font-medium text-gray-700">显示使用教程</div>
                      <div className="text-sm text-gray-500">首次使用时显示功能引导</div>
                    </label>
                  </div>
                </div>
              )}

              {/* 高级设置 */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">API设置</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          API端点
                        </label>
                        <input
                          type="text"
                          value={settings.advanced.apiEndpoint}
                          onChange={(e) => handleSettingChange('advanced', 'apiEndpoint', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="http://localhost:8787"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          后端API服务地址，开发时通常为 http://localhost:8787
                        </p>
                      </div>

                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="useMockApi"
                          checked={settings.advanced.useMockApi}
                          onChange={(e) => handleSettingChange('advanced', 'useMockApi', e.target.checked)}
                          className="mt-1 h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="useMockApi" className="ml-3">
                          <div className="font-medium text-gray-700">使用模拟API</div>
                          <div className="text-sm text-gray-500">开发时使用模拟数据，不调用真实API</div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">其他选项</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="debugMode"
                          checked={settings.advanced.debugMode}
                          onChange={(e) => handleSettingChange('advanced', 'debugMode', e.target.checked)}
                          className="mt-1 h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="debugMode" className="ml-3">
                          <div className="font-medium text-gray-700">调试模式</div>
                          <div className="text-sm text-gray-500">显示详细日志和调试信息</div>
                        </label>
                      </div>

                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="saveHistory"
                          checked={settings.advanced.saveHistory}
                          onChange={(e) => handleSettingChange('advanced', 'saveHistory', e.target.checked)}
                          className="mt-1 h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="saveHistory" className="ml-3">
                          <div className="font-medium text-gray-700">保存处理历史</div>
                          <div className="text-sm text-gray-500">在本地保存处理过的图片记录（仅保存元数据）</div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-700 mb-2">⚠️ 注意事项</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 修改API端点后需要刷新页面生效</li>
                      <li>• 调试模式会显示敏感信息，请勿在生产环境开启</li>
                      <li>• 处理历史仅保存在浏览器本地，清除缓存会丢失</li>
                      <li>• 所有设置自动保存到本地存储</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* 底部 */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  取消
                </button>
                
                <div className="text-sm text-gray-500">
                  版本 1.0.0 • 设置已自动保存
                </div>
                
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-colors"
                >
                  完成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Settings