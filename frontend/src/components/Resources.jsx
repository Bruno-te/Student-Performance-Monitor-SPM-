import { FiBook, FiVideo, FiFileText, FiDownload } from 'react-icons/fi';

const Resources = () => {
  const resources = [
    {
      id: 1,
      title: 'Mathematics Study Guide',
      type: 'PDF',
      category: 'Study Material',
      size: '2.5 MB',
      icon: FiFileText,
    },
    {
      id: 2,
      title: 'Science Video Tutorial',
      type: 'Video',
      category: 'Tutorial',
      size: '15 MB',
      icon: FiVideo,
    },
    {
      id: 3,
      title: 'English Literature Notes',
      type: 'PDF',
      category: 'Study Material',
      size: '1.8 MB',
      icon: FiBook,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Educational Resources</h2>
        <p className="text-gray-600">
          Access quality educational materials to support your learning journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => {
          const Icon = resource.icon;
          return (
            <div key={resource.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Icon className="text-primary-600" size={24} />
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                  {resource.type}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {resource.title}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">{resource.category}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{resource.size}</span>
                <button className="btn btn-primary text-sm flex items-center">
                  <FiDownload className="mr-2" size={16} />
                  Download
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card bg-primary-50 border border-primary-200">
        <h3 className="text-lg font-semibold text-primary-800 mb-2">
          Access to Quality Education
        </h3>
        <p className="text-primary-700">
          EduBridge Africa is committed to providing accessible educational resources
          to students across Africa. Our platform bridges gaps in education by offering
          comprehensive learning materials and performance tracking tools.
        </p>
      </div>
    </div>
  );
};

export default Resources;

