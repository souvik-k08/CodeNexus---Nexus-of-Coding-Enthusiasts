import { useState } from 'react';
import { User } from 'lucide-react';

const ProfileAvatar = ({ secureUrl, size = 128 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`relative mx-auto w-[${size}px] h-[${size}px] rounded-full overflow-hidden shadow-lg border border-gray-200 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: size, height: size }}
    >
      {secureUrl && !imageError ? (
        <img
          src={secureUrl}
          alt="Profile"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500">
          <User size={size / 2} />
        </div>
      )}

      {/* Optional Hover Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-sm font-medium transition-opacity">
          {/* Future actions like 'Edit' can go here */}
          Profile
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;
