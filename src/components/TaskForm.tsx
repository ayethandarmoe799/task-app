import React, { useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TaskFormProps {
  initialTitle?: string;
  initialDescription?: string;
  initialStatus?: string;
  initialCategoryId?: string;
  initialTags?: Tag[];
  categories: Category[];
  tags: Tag[];
  loading: boolean;
  error: string;
  onSubmit: (data: {
    title: string;
    description: string;
    status: string;
    categoryId: string;
    tagIds: string[];
  }) => void;
  onCancel?: () => void;
  onTagInput?: (tagName: string) => void;
  selectedTags: Tag[];
  setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  tagInput: string;
  setTagInput: React.Dispatch<React.SetStateAction<string>>;
}

const TaskForm: React.FC<TaskFormProps> = ({
  initialTitle = "",
  initialDescription = "",
  initialStatus = "pending",
  initialCategoryId = "",
  initialTags = [],
  categories,
  tags,
  loading,
  error,
  onSubmit,
  onCancel,
  onTagInput,
  selectedTags,
  setSelectedTags,
  tagInput,
  setTagInput,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [status, setStatus] = useState(initialStatus);
  const [categoryId, setCategoryId] = useState(initialCategoryId);

  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setStatus(initialStatus);
    setCategoryId(initialCategoryId);
  }, [initialTitle, initialDescription, initialStatus, initialCategoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      status,
      categoryId,
      tagIds: selectedTags.map(t => t.id),
    });
  };

  const handleTagInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (onTagInput) onTagInput(tagInput.trim());
    }
  };

  const handleRemoveTag = (id: string) => {
    setSelectedTags(prev => prev.filter(t => t.id !== id));
  };

  const handleSelectTag = (id: string) => {
    const tag = tags.find(t => t.id === id);
    if (tag && !selectedTags.some(tg => tg.id === id)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-black mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          placeholder="Enter task title"
          required
          aria-label="Task Title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          placeholder="Enter task description"
          rows={3}
          aria-label="Task Description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          aria-label="Task Status"
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">Category</label>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          aria-label="Task Category"
        >
          <option value="">No Category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map(tag => (
            <span key={tag.id} className="flex items-center px-2 py-1 text-xs font-medium rounded-full text-white" style={{ backgroundColor: tag.color }}>
              {tag.name}
              <button type="button" className="ml-1 text-white" onClick={() => handleRemoveTag(tag.id)}>&times;</button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleTagInputKeyDown}
          className="w-full p-2 border border-gray-300 rounded text-black"
          placeholder="Type a tag and press Enter"
          aria-label="Tag Input"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.filter(t => !selectedTags.some(st => st.id === t.id)).map(tag => (
            <button key={tag.id} type="button" className="px-2 py-1 text-xs rounded-full text-white" style={{ backgroundColor: tag.color }} onClick={() => handleSelectTag(tag.id)}>
              {tag.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
          disabled={loading}
        >
          Save
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors w-full sm:w-auto"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default TaskForm; 