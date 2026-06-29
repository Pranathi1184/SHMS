import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';

const TableSkeletonLoader = ({ rows = 6 }) => {
  return (
    <Stack spacing={1.25}>
      {Array.from({ length: rows }).map((_, idx) => (
        <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr 1fr', gap: 1 }}>
          <Skeleton height={34} />
          <Skeleton height={34} />
          <Skeleton height={34} />
          <Skeleton height={34} />
        </Box>
      ))}
    </Stack>
  );
};

export default TableSkeletonLoader;
