import React from 'react';

const AllocationLoader = () => {
  // Create an array of 6 items to show as loading skeletons
  const skeletonItems = Array(6).fill(null);
  
  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-4">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-20">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex gap-4">
          <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="border-b border-gray-200">
        <div className="flex gap-2 p-2">
          <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {skeletonItems.map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Card Header Skeleton */}
            <div className="p-4 border-b">
              <div className="flex justify-between items-start">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Card Content Skeleton */}
            <div className="p-4 space-y-4">
              {/* Subjects Section */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array(3).fill(null).map((_, i) => (
                    <div key={i} className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                  ))}
                </div>
              </div>

              {/* Classes Section */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array(2).fill(null).map((_, i) => (
                    <div key={i} className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
                  ))}
                </div>
              </div>

              {/* Footer Section */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllocationLoader;