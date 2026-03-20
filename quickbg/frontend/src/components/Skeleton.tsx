import React from 'react'

interface SkeletonProps {
  type?: 'card' | 'text' | 'image' | 'button' | 'circle'
  width?: string | number
  height?: string | number
  className?: string
  count?: number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  animation?: 'pulse' | 'wave' | 'none'
}

const Skeleton: React.FC<SkeletonProps> = ({
  type = 'card',
  width,
  height,
  className = '',
  count = 1,
  rounded = 'md',
  animation = 'pulse'
}) => {
  const getSkeletonClass = () => {
    const baseClass = 'bg-gray-200 dark:bg-gray-700'
    const roundedClass = {
      none: '',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    }[rounded]
    
    const animationClass = {
      pulse: 'animate-pulse',
      wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]',
      none: ''
    }[animation]
    
    return `${baseClass} ${roundedClass} ${animationClass} ${className}`
  }

  const renderSkeleton = (key: number) => {
    switch (type) {
      case 'card':
        return (
          <div 
            key={key}
            className={getSkeletonClass()}
            style={{ width: width || '100%', height: height || '200px' }}
          />
        )
        
      case 'text':
        return (
          <div 
            key={key}
            className={getSkeletonClass()}
            style={{ width: width || '100%', height: height || '1rem' }}
          />
        )
        
      case 'image':
        return (
          <div 
            key={key}
            className={getSkeletonClass()}
            style={{ width: width || '100%', height: height || '150px' }}
          />
        )
        
      case 'button':
        return (
          <div 
            key={key}
            className={getSkeletonClass()}
            style={{ width: width || '100px', height: height || '2.5rem' }}
          />
        )
        
      case 'circle':
        return (
          <div 
            key={key}
            className={getSkeletonClass()}
            style={{ 
              width: width || '50px', 
              height: height || '50px',
              borderRadius: '50%'
            }}
          />
        )
        
      default:
        return null
    }
  }

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => renderSkeleton(index))}
      </div>
    )
  }

  return renderSkeleton(0)
}

// 预定义的骨架屏组合
export const CardSkeleton: React.FC = () => (
  <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
    <Skeleton type="image" height="150px" rounded="lg" />
    <div className="space-y-2">
      <Skeleton type="text" width="70%" />
      <Skeleton type="text" width="50%" />
    </div>
    <div className="flex gap-2">
      <Skeleton type="button" width="80px" />
      <Skeleton type="button" width="60px" />
    </div>
  </div>
)

export const ProfileSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-4">
    <Skeleton type="circle" width="48px" height="48px" />
    <div className="space-y-2 flex-1">
      <Skeleton type="text" width="60%" />
      <Skeleton type="text" width="40%" />
    </div>
  </div>
)

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-800">
        <Skeleton type="circle" width="40px" height="40px" />
        <div className="flex-1 space-y-2">
          <Skeleton type="text" width={`${70 + Math.random() * 20}%`} />
          <Skeleton type="text" width={`${40 + Math.random() * 20}%`} />
        </div>
      </div>
    ))}
  </div>
)

export const GridSkeleton: React.FC<{ columns?: number; count?: number }> = ({ 
  columns = 3, 
  count = 6 
}) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${columns} gap-4`}>
    {Array.from({ length: count }).map((_, index) => (
      <CardSkeleton key={index} />
    ))}
  </div>
)

// 页面级骨架屏
export const PageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    {/* 头部 */}
    <div className="text-center space-y-4">
      <Skeleton type="text" width="200px" height="2.5rem" className="mx-auto" />
      <Skeleton type="text" width="300px" height="1.25rem" className="mx-auto" />
    </div>
    
    {/* 主要内容 */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 左侧 */}
      <div className="space-y-4">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
          <Skeleton type="text" width="120px" height="1.5rem" className="mb-4" />
          <Skeleton type="image" height="150px" rounded="lg" className="mb-4" />
          <div className="space-y-2">
            <Skeleton type="text" width="100%" />
            <Skeleton type="text" width="80%" />
          </div>
        </div>
        
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="flex gap-2">
            <Skeleton type="button" width="100%" />
            <Skeleton type="button" width="80px" />
          </div>
        </div>
      </div>
      
      {/* 右侧 */}
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
        <Skeleton type="text" width="120px" height="1.5rem" className="mb-4" />
        <Skeleton type="image" height="250px" rounded="lg" />
      </div>
    </div>
    
    {/* 底部 */}
    <div className="text-center">
      <Skeleton type="text" width="300px" height="1rem" className="mx-auto" />
      <Skeleton type="text" width="200px" height="1rem" className="mx-auto mt-2" />
    </div>
  </div>
)

export default Skeleton