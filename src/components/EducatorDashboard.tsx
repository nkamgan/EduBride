
import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  BarChart2, 
  PieChart as PieChartIcon, 
  Activity,
  Award,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface EducatorDashboardProps {
  lang: 'en' | 'fr';
}

export const EducatorDashboard: React.FC<EducatorDashboardProps> = ({ lang }) => {
  const t = {
    en: {
      title: 'Educator Command Center',
      subtitle: 'Monitoring class engagement and STEM mastery',
      classSize: 'Total Students',
      avgMastery: 'Class Avg Mastery',
      activeNow: 'Currently Online',
      alertTopics: 'Action Required',
      performanceTitle: 'Weekly Mastery Growth',
      distributionTitle: 'Topic Distribution',
      studentTable: 'Student Overview',
      name: 'Name',
      progress: 'Progress',
      status: 'Status',
      mastery: 'Mastery',
    },
    fr: {
      title: 'Centre de Commandement',
      subtitle: 'Suivi de l\'engagement et de la maîtrise STEM',
      classSize: 'Total Étudiants',
      avgMastery: 'Maîtrise Moyenne',
      activeNow: 'En Ligne',
      alertTopics: 'Action Requise',
      performanceTitle: 'Croissance Hebdomadaire',
      distributionTitle: 'Répartition des Sujets',
      studentTable: 'Aperçu des Étudiants',
      name: 'Nom',
      progress: 'Progrès',
      status: 'Statut',
      mastery: 'Maîtrise',
    }
  }[lang];

  const barData = [
    { name: 'Mon', mastery: 65 },
    { name: 'Tue', mastery: 68 },
    { name: 'Wed', mastery: 72 },
    { name: 'Thu', mastery: 70 },
    { name: 'Fri', mastery: 75 },
    { name: 'Sat', mastery: 76 },
    { name: 'Sun', mastery: 80 },
  ];

  const pieData = [
    { name: 'Math', value: 45, color: '#3b82f6' },
    { name: 'Physics', value: 30, color: '#f59e0b' },
    { name: 'Chemistry', value: 25, color: '#10b981' },
  ];

  const students = [
    { id: 1, name: 'Amara K.', mastery: 88, progress: 95, status: 'Exceeding' },
    { id: 2, name: 'Jean D.', mastery: 62, progress: 40, status: 'Normal' },
    { id: 3, name: 'Saran O.', mastery: 45, progress: 20, status: 'Needs Support' },
    { id: 4, name: 'Malick T.', mastery: 78, progress: 80, status: 'Normal' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto py-10 px-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">{t.title}</h1>
          <p className="text-slate-500 font-medium">{t.subtitle}</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button className="px-4 py-2 bg-white shadow-sm rounded-lg text-sm font-bold text-slate-900">Today</button>
           <button className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Week</button>
           <button className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Month</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t.classSize, value: '42', icon: Users, delta: '+3', up: true },
          { label: t.avgMastery, value: '72%', icon: TrendingUp, delta: '+5%', up: true },
          { label: t.activeNow, value: '18', icon: Activity, delta: '-4', up: false },
          { label: t.alertTopics, value: 'Algebra', icon: AlertCircle, delta: 'High Difficulty', up: false, alert: true },
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-[32px] border ${stat.alert ? 'border-red-100 bg-red-50/30' : 'border-slate-100 bg-white'} shadow-sm`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.alert ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center text-xs font-bold ${stat.up ? 'text-emerald-600' : 'text-slate-400'}`}>
                {stat.up ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {stat.delta}
              </div>
            </div>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">{t.performanceTitle}</h3>
            <BarChart2 className="w-5 h-5 text-slate-300" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="mastery" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">{t.distributionTitle}</h3>
            <PieChartIcon className="w-5 h-5 text-slate-300" />
          </div>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-2xl font-bold text-slate-900">3</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Fields</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {pieData.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-slate-600 font-medium">{p.name}</span>
                </div>
                <span className="text-slate-900 font-bold">{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{t.studentTable}</h3>
          <button className="text-brand font-bold text-sm hover:underline">View All Students</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.name}</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.mastery}</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.progress}</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4 font-bold text-slate-900">{student.name}</td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                        <div className="h-full bg-brand rounded-full" style={{ width: `${student.mastery}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{student.mastery}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-sm text-slate-600">{student.progress}%</td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      student.status === 'Exceeding' ? 'bg-emerald-50 text-emerald-600' :
                      student.status === 'Needs Support' ? 'bg-red-50 text-red-600' :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
