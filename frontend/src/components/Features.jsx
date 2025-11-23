import {
  FiTrendingUp,
  FiBell,
  FiUsers,
  FiBarChart2,
  FiMessageSquare,
  FiBook,
} from 'react-icons/fi';

const Features = () => {
  const features = [
    {
      icon: FiTrendingUp,
      title: 'Performance Tracking',
      description: 'Monitor student progress with real-time grade tracking and performance analytics.',
    },
    {
      icon: FiBell,
      title: 'Parent Alerts',
      description: 'Automatic notifications to parents about their children\'s academic performance and attendance.',
    },
    {
      icon: FiUsers,
      title: 'Stakeholder Engagement',
      description: 'Connect students, parents, teachers, and administrators in one unified platform.',
    },
    {
      icon: FiBarChart2,
      title: 'Analytics & Reports',
      description: 'Comprehensive reports and insights to identify areas for improvement.',
    },
    {
      icon: FiMessageSquare,
      title: 'Communication Hub',
      description: 'Direct messaging between all stakeholders for better collaboration.',
    },
    {
      icon: FiBook,
      title: 'Resource Access',
      description: 'Access to quality educational materials and resources to support learning.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Platform Features</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          EduBridge Africa provides comprehensive tools to improve student performance
          and enhance access to quality education across Africa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="card hover:shadow-lg transition-shadow">
              <div className="p-3 bg-primary-100 rounded-lg w-fit mb-4">
                <Icon className="text-primary-600" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          );
        })}
      </div>

      <div className="card bg-gradient-to-r from-primary-500 to-primary-700 text-white">
        <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
        <p className="text-primary-100 text-lg leading-relaxed">
          We believe that education is a powerful driver of change. By using technology,
          we bridge gaps in access to resources, improve engagement between stakeholders,
          and provide effective systems to track progress. Together, we empower both
          students and educators to succeed.
        </p>
      </div>
    </div>
  );
};

export default Features;

