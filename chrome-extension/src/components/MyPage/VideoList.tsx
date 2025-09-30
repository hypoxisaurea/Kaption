import React from 'react'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'

interface VideoListProps {
  analysisHistory: any[]
  selectedVideo: any | null
  onVideoSelect: (video: any) => void
}

/**
 * VideoList - 분석된 영상들의 목록을 표시하는 컴포넌트
 * 
 * @param analysisHistory - 분석 기록 목록
 * @param selectedVideo - 현재 선택된 영상
 * @param onVideoSelect - 영상 선택 핸들러
 */


function VideoList({ analysisHistory, selectedVideo, onVideoSelect }: VideoListProps) {
  const Item = styled(Paper, {
    shouldForwardProp: (prop) => prop !== 'selected',
  })<{ selected?: boolean }>(({ theme, selected }) => ({
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: theme.spacing(1.5, 2),
    borderRadius:
      typeof theme.shape.borderRadius === 'number'
        ? theme.shape.borderRadius * 1.5
        : theme.shape.borderRadius,
    cursor: 'pointer',
    transition: 'background-color 150ms ease, color 150ms ease',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: selected ? '#ffffff' : '#ffffff',
    color: selected ? '#000000' : '#000000',
    '&:hover': {
      backgroundColor: selected ? '#f9f9f9' : '#ffffff',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius:
        typeof theme.shape.borderRadius === 'number'
          ? theme.shape.borderRadius * 1.5
          : theme.shape.borderRadius,
      background: 'linear-gradient(135deg, rgba(255, 140, 122, 0.4), rgba(46, 196, 182, 0.4))',
      backdropFilter: 'blur(0.6vw)',
      opacity: 0,
      transition: 'opacity 200ms ease',
      pointerEvents: 'none',
    },
    '&:hover::after': {
      opacity: 1,
    },
  }))

  return (
    <div className="mb-6 w-full">
      <div className="text-white text-lg font-semibold mb-4">My Learning History</div>
      <Box sx={{ width: '100%' }}>
        <Stack spacing={1.5}>
          {analysisHistory.map((video) => (
            <Item
              key={video.videoId}
              onClick={() => onVideoSelect(video)}
              elevation={0}
              selected={selectedVideo?.videoId === video.videoId}
            >
              {/* 영상 제목이 30자 이상이면 줄임표 표시 */}
              {video.videoInfo.title.length > 30
                ? video.videoInfo.title.substring(0, 30) + '...'
                : video.videoInfo.title}
            </Item>
          ))}
        </Stack>
      </Box>

      </div>
  )
}

export default VideoList;