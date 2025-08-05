
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../../../../Day15/frontend/src/utils/axiosClient';
import { useNavigate, useParams } from 'react-router';

// Zod schema matching the problem schema
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array','linkedList','graph','dp', 'string', 'tree', 'recursion', 'stack']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      completeCode: z.string().min(1, 'Complete code is required')
    })
  ).length(3, 'All three languages required')
});

function ProblemEditor() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [problemData, setProblemData] = useState(null);
  
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'easy',
      tags: 'array',
      visibleTestCases: [{ input: '', output: '', explanation: '' }],
      hiddenTestCases: [{ input: '', output: '' }],
      startCode: [
        { language: 'C++', initialCode: '' },
        { language: 'Java', initialCode: '' },
        { language: 'JavaScript', initialCode: '' }
      ],
      referenceSolution: [
        { language: 'C++', completeCode: '' },
        { language: 'Java', completeCode: '' },
        { language: 'JavaScript', completeCode: '' }
      ]
    }
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setIsLoading(true);
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
        setProblemData(response.data);
        
        // Prepare data for form with proper field array initialization
        const formData = {
          ...response.data,
          visibleTestCases: response.data.visibleTestCases || [],
          hiddenTestCases: response.data.hiddenTestCases || [],
          startCode: response.data.startCode || [
            { language: 'C++', initialCode: '' },
            { language: 'Java', initialCode: '' },
            { language: 'JavaScript', initialCode: '' }
          ],
          referenceSolution: response.data.referenceSolution || [
            { language: 'C++', completeCode: '' },
            { language: 'Java', completeCode: '' },
            { language: 'JavaScript', completeCode: '' }
          ]
        };
        
        reset(formData);
      } catch (error) {
        console.error('Error fetching problem:', error);
        alert(`Failed to load problem: ${error.response?.data?.message || error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (problemId) {
      fetchProblem();
    }
  }, [problemId, reset]);

  const onSubmit = async (data) => {
    try {
      await axiosClient.put(`/problem/update/${problemId}`, data);
      alert('Problem updated successfully!');
      navigate('/admin/update');
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
        <span className="ml-4 text-lg">Loading problem data...</span>
      </div>
    );
  }

  if (!problemData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Problem not found or failed to load.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Problem</h1>
        <button 
          onClick={() => navigate(-1)}
          className="btn btn-ghost"
        >
          Cancel
        </button>
      </div>
      
      <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="badge badge-lg badge-primary">{problemId}</div>
          <div className={`badge badge-lg ${problemData.difficulty === 'easy' ? 'badge-success' : problemData.difficulty === 'medium' ? 'badge-warning' : 'badge-error'}`}>
            {problemData.difficulty}
          </div>
          <div className="badge badge-lg badge-outline">{problemData.tags}</div>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">
          Last updated: {new Date(problemData.updatedAt).toLocaleString()}
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Title</span>
              </label>
              <input
                {...register('title')}
                className={`input input-bordered ${errors.title && 'input-error'}`}
              />
              {errors.title && (
                <span className="text-error">{errors.title.message}</span>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                {...register('description')}
                className={`textarea textarea-bordered h-48 ${errors.description && 'textarea-error'}`}
              />
              {errors.description && (
                <span className="text-error">{errors.description.message}</span>
              )}
            </div>

            <div className="flex gap-4">
              <div className="form-control w-1/2">
                <label className="label">
                  <span className="label-text">Difficulty</span>
                </label>
                <select
                  {...register('difficulty')}
                  className={`select select-bordered ${errors.difficulty && 'select-error'}`}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="form-control w-1/2">
                <label className="label">
                  <span className="label-text">Tag</span>
                </label>
                <select
                  {...register('tags')}
                  className={`select select-bordered ${errors.tags && 'select-error'}`}
                >
                  <option value="array">Array</option>
                  <option value="linkedList">Linked List</option>
                  <option value="graph">Graph</option>
                  <option value="dp">DP</option>
                  <option value="string">String</option>
                  <option value="tree">Tree</option>
                  <option value="recursion">Recursion</option>
                  <option value="stack">Stack</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Test Cases */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
          
          {/* Visible Test Cases */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Visible Test Cases</h3>
              <button
                type="button"
                onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                className="btn btn-sm btn-primary"
              >
                Add Visible Case
              </button>
            </div>
            
            {visibleFields.map((field, index) => (
              <div key={field.id} className="border border-base-300 p-4 rounded-lg space-y-2 bg-base-200">
                <div className="flex justify-between items-center">
                  <div className="badge badge-neutral">Case #{index + 1}</div>
                  <button
                    type="button"
                    onClick={() => removeVisible(index)}
                    className="btn btn-xs btn-error"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Input</span>
                  </label>
                  <input
                    {...register(`visibleTestCases.${index}.input`)}
                    placeholder="Input"
                    className={`input input-bordered w-full ${errors.visibleTestCases?.[index]?.input && 'input-error'}`}
                  />
                  {errors.visibleTestCases?.[index]?.input && (
                    <span className="text-error text-sm">{errors.visibleTestCases[index].input.message}</span>
                  )}
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Output</span>
                  </label>
                  <input
                    {...register(`visibleTestCases.${index}.output`)}
                    placeholder="Output"
                    className={`input input-bordered w-full ${errors.visibleTestCases?.[index]?.output && 'input-error'}`}
                  />
                  {errors.visibleTestCases?.[index]?.output && (
                    <span className="text-error text-sm">{errors.visibleTestCases[index].output.message}</span>
                  )}
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Explanation</span>
                  </label>
                  <textarea
                    {...register(`visibleTestCases.${index}.explanation`)}
                    placeholder="Explanation"
                    className={`textarea textarea-bordered w-full ${errors.visibleTestCases?.[index]?.explanation && 'textarea-error'}`}
                    rows={2}
                  />
                  {errors.visibleTestCases?.[index]?.explanation && (
                    <span className="text-error text-sm">{errors.visibleTestCases[index].explanation.message}</span>
                  )}
                </div>
              </div>
            ))}
            {errors.visibleTestCases && errors.visibleTestCases.message && (
              <div className="text-error">{errors.visibleTestCases.message}</div>
            )}
          </div>

          {/* Hidden Test Cases */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Hidden Test Cases</h3>
              <button
                type="button"
                onClick={() => appendHidden({ input: '', output: '' })}
                className="btn btn-sm btn-primary"
              >
                Add Hidden Case
              </button>
            </div>
            
            {hiddenFields.map((field, index) => (
              <div key={field.id} className="border border-base-300 p-4 rounded-lg space-y-2 bg-base-200">
                <div className="flex justify-between items-center">
                  <div className="badge badge-neutral">Case #{index + 1}</div>
                  <button
                    type="button"
                    onClick={() => removeHidden(index)}
                    className="btn btn-xs btn-error"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Input</span>
                  </label>
                  <input
                    {...register(`hiddenTestCases.${index}.input`)}
                    placeholder="Input"
                    className={`input input-bordered w-full ${errors.hiddenTestCases?.[index]?.input && 'input-error'}`}
                  />
                  {errors.hiddenTestCases?.[index]?.input && (
                    <span className="text-error text-sm">{errors.hiddenTestCases[index].input.message}</span>
                  )}
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Output</span>
                  </label>
                  <input
                    {...register(`hiddenTestCases.${index}.output`)}
                    placeholder="Output"
                    className={`input input-bordered w-full ${errors.hiddenTestCases?.[index]?.output && 'input-error'}`}
                  />
                  {errors.hiddenTestCases?.[index]?.output && (
                    <span className="text-error text-sm">{errors.hiddenTestCases[index].output.message}</span>
                  )}
                </div>
              </div>
            ))}
            {errors.hiddenTestCases && errors.hiddenTestCases.message && (
              <div className="text-error">{errors.hiddenTestCases.message}</div>
            )}
          </div>
        </div>

        {/* Code Templates */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Code Templates</h2>
          
          <div className="space-y-6">
            {[0, 1, 2].map((index) => (
              <div key={index} className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">
                  {index === 0 ? 'C++' : index === 1 ? 'Java' : 'JavaScript'}
                </h3>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Initial Code</span>
                  </label>
                  <div className={`border rounded-lg p-2 ${errors.startCode?.[index]?.initialCode && 'border-error'}`}>
                    <textarea
                      {...register(`startCode.${index}.initialCode`)}
                      className="w-full bg-base-100 font-mono text-sm p-2 min-h-[150px]"
                    />
                  </div>
                  {errors.startCode?.[index]?.initialCode && (
                    <span className="text-error text-sm">{errors.startCode[index].initialCode.message}</span>
                  )}
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Reference Solution</span>
                  </label>
                  <div className={`border rounded-lg p-2 ${errors.referenceSolution?.[index]?.completeCode && 'border-error'}`}>
                    <textarea
                      {...register(`referenceSolution.${index}.completeCode`)}
                      className="w-full bg-base-100 font-mono text-sm p-2 min-h-[150px]"
                    />
                  </div>
                  {errors.referenceSolution?.[index]?.completeCode && (
                    <span className="text-error text-sm">{errors.referenceSolution[index].completeCode.message}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button 
            type="button"
            onClick={() => reset()}
            className="btn btn-outline"
            disabled={!isDirty}
          >
            Reset Changes
          </button>
          <button 
            type="submit"
            className="btn btn-primary"
            disabled={!isDirty}
          >
            Update Problem
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProblemEditor;