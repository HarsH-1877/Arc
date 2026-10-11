# Task 1 Brief: Contest History 3-Line Graph Platform Badges

## Goal
Add platform logo badges and abbreviations (`CF`, `LC`, `CC`) to each of the 3 stacked rating line charts in the Contest History page when "All Platforms" is selected.

## File to Modify
`src/components/contest-history/CombinedRatingCard.tsx`

## Details & Implementation
In `src/components/contest-history/CombinedRatingCard.tsx`:
Currently lines 110-145 render:
```tsx
        <div className="relative mt-1 min-h-[58px] w-full flex-1 -mx-1 -mb-1 flex flex-col gap-0.5">
          {displayPlatforms.map(platform => {
            const pData = chartData.filter(d => d.platform === platform);
            const color = platform === 'CODEFORCES' ? '#3b82f6' : platform === 'CODECHEF' ? '#b45309' : '#f59e0b';
            return (
              <div key={platform} className="flex-1 min-h-0 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={pData} 
                    onMouseMove={(e) => {
                      if (e.activePayload) setHovered(e.activePayload[0].payload);
                    }}
                    onMouseLeave={() => setHovered(null)}
                    margin={{ top: 2, right: 10, bottom: 2, left: 10 }}
                  >
                    <XAxis dataKey="year" hide />
                    <Tooltip 
                      content={<></>} 
                      cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '4 4' }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rating" 
                      stroke={color} 
                      strokeWidth={2}
                      dot={{ r: 0, fill: color, strokeWidth: 0 }}
                      activeDot={{ r: 4, fill: color, stroke: '#11131d', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
```

Update it so each row has:
1. A left platform badge:
```tsx
                <div
                  className="flex shrink-0 items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono-data border leading-none"
                  style={{
                    background: `${color}15`,
                    borderColor: `${color}35`,
                    color,
                    minWidth: '42px',
                  }}
                  title={platform === 'CODEFORCES' ? 'Codeforces' : platform === 'CODECHEF' ? 'CodeChef' : 'LeetCode'}
                >
                  <PlatformLogo platform={platform} size={12} active={true} />
                  <span>{platform === 'CODEFORCES' ? 'CF' : platform === 'CODECHEF' ? 'CC' : 'LC'}</span>
                </div>
```
2. The `ResponsiveContainer` and `LineChart` beside it in a flex container (`flex items-center gap-1.5 relative`). Note that `PlatformLogo` is already imported in `CombinedRatingCard.tsx`? Check imports: if not imported, import `{ PlatformLogo } from '@/components/shared/PlatformLogo';`.
3. Verify that container height `min-h-[180px]` is preserved and nothing overflows.
4. Verify by running `npm run build`.
5. Commit: `feat: add platform logo badges to stacked contest history rating graphs`.
