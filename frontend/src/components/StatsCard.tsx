import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  alpha,
} from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactElement<SvgIconComponent>;
  gradient: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  gradient,
  trend,
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.15)',
        },
        transition: 'all 0.3s ease-in-out',
      }}
    >
      {/* Background gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: gradient,
          borderRadius: '50%',
          transform: 'translate(30px, -30px)',
          opacity: 0.1,
        }}
      />
      
      <CardContent sx={{ position: 'relative', p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
              color: 'white',
              fontSize: 24,
            }}
          >
            {icon}
          </Box>
        </Box>

        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: trend.isPositive 
                  ? alpha(theme.palette.success.main, 0.1)
                  : alpha(theme.palette.error.main, 0.1),
                color: trend.isPositive 
                  ? theme.palette.success.main
                  : theme.palette.error.main,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {trend.isPositive ? '+' : ''}{trend.value}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              vs last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
