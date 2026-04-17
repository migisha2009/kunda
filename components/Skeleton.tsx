'use client'

interface Props {
  width?: string | number
  height?: number
  borderRadius?: number
  style?: React.CSSProperties
}

export default function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
}: Props) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #e5edff 25%, #f0f4ff 50%, #e5edff 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }} />
  )
}

export function StatCardSkeleton() {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #e5edff',
      padding: '18px 20px',
    }}>
      <Skeleton width={40} height={40} 
        borderRadius={50} style={{ marginBottom: 12 }} />
      <Skeleton width="60%" height={32} 
        style={{ marginBottom: 8 }} />
      <Skeleton width="40%" height={12} />
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <tr>
      {[1,2,3,4].map(i => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <Skeleton height={14} 
            width={i === 1 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  )
}
