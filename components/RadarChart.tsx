
import React from 'react';
import {
  Radar, RadarChart as ReRadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

interface RadarChartProps {
  data: { subject: string; value: number }[];
}

const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[300px] md:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ReRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="能力评估"
            dataKey="value"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.3}
          />
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;
