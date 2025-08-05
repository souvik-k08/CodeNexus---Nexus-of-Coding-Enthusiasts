
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../utils/axiosClient"
import SubmissionHistory from "../components/SubmissionHistory"
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';
import { FaPlay, FaPaperPlane, FaTerminal, FaCode, FaFileAlt, FaBook, FaHistory, FaRobot, FaCheck, FaTimes } from 'react-icons/fa';

const langMap = {
        cpp: 'C++',
        java: 'Java',
        javascript: 'JavaScript'
};


const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const editorRef = useRef(null);
  let {problemId}  = useParams();

  // console.log(problem);

  const { handleSubmit } = useForm();

 useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
       
        
        const initialCode = response.data.startCode.find(sc => sc.language === langMap[selectedLanguage]).initialCode;

        setProblem(response.data);
        
        setCode(initialCode);
        setLoading(false);
        
      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // Update code when language changes
  useEffect(() => {
    if (problem) {
      const initialCode = problem.startCode.find(sc => sc.language === langMap[selectedLanguage]).initialCode;
      setCode(initialCode);
    }
  }, [selectedLanguage, problem]);

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    
    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
      setLoading(false);
      setActiveRightTab('testcase');
      
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Internal server error'
      });
      setLoading(false);
      setActiveRightTab('testcase');
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    
    try {
        const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code:code,
        language: selectedLanguage
      });

       setSubmitResult(response.data);
       setLoading(false);
       setActiveRightTab('result');
      
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
      setLoading(false);
      setActiveRightTab('result');
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    return status === 'Passed' 
      ? <FaCheck className="text-green-500 mr-1" /> 
      : <FaTimes className="text-red-500 mr-1" />;
  };

  if (loading && !problem) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-base-100 overflow-hidden">
      {/* Left Panel */}
      <div className="w-1/2 flex flex-col border-r border-base-300">
        {/* Left Tabs */}
        <div className="flex bg-base-200 px-2 py-1 border-b border-base-300">
          {[
            { id: 'description', icon: <FaFileAlt className="mr-1" />, label: 'Description' },
            { id: 'editorial', icon: <FaBook className="mr-1" />, label: 'Editorial' },
            { id: 'solutions', icon: <FaCode className="mr-1" />, label: 'Solutions' },
            { id: 'submissions', icon: <FaHistory className="mr-1" />, label: 'Submissions' },
            { id: 'chatAI', icon: <FaRobot className="mr-1" />, label: 'ChatAI' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`flex items-center px-4 py-2 rounded-t-lg transition-all ${
                activeLeftTab === tab.id
                  ? 'bg-base-100 text-primary border-t-2 border-primary font-semibold'
                  : 'text-gray-600 hover:bg-base-300'
              }`}
              onClick={() => setActiveLeftTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Left Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {problem && (
            <>
              {activeLeftTab === 'description' && (
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <h1 className="text-2xl font-bold text-primary">{problem.title}</h1>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {problem.tags.split(',').map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-base-200 rounded-md text-xs">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="prose max-w-none mb-8">
                    <div className="whitespace-pre-wrap text-base leading-relaxed">
                      {problem.description}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <span className="bg-primary w-2 h-5 rounded mr-2"></span>
                      Examples
                    </h3>
                    <div className="space-y-4">
                      {problem.visibleTestCases.map((example, index) => (
                        <div key={index} className="bg-base-200 p-4 rounded-lg border-l-4 border-primary">
                          <h4 className="font-semibold mb-2 text-primary">Example {index + 1}:</h4>
                          <div className="space-y-2 text-sm font-mono bg-base-300 p-3 rounded">
                            <div><strong className="text-accent">Input:</strong> {example.input}</div>
                            <div><strong className="text-accent">Output:</strong> {example.output}</div>
                            {example.explanation && (
                              <div><strong className="text-accent">Explanation:</strong> {example.explanation}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'editorial' && (
                <div className="prose max-w-none">
                  <h2 className="text-xl font-bold mb-4">Editorial</h2>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    <Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration}/>
                  </div>
                </div>
              )}

              {activeLeftTab === 'solutions' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Solutions</h2>
                  <div className="space-y-6">
                    {problem.referenceSolution?.map((solution, index) => (
                      <div key={index} className="border border-base-300 rounded-lg">
                        <div className="bg-base-200 px-4 py-2 rounded-t-lg">
                          <h3 className="font-semibold">{problem?.title} - {solution?.language}</h3>
                        </div>
                        <div className="p-4">
                          <pre className="bg-base-300 p-4 rounded text-sm overflow-x-auto">
                            <code>{solution?.completeCode}</code>
                          </pre>
                        </div>
                      </div>
                    )) || <p className="text-gray-500">Solutions will be available after you solve the problem.</p>}
                  </div>
                </div>
              )}

              {activeLeftTab === 'submissions' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">My Submissions</h2>
                  <div className="text-gray-500">
                    <SubmissionHistory problemId={problemId} />
                  </div>
                </div>
              )}

              <div className={`prose max-w-none ${activeLeftTab === 'chatAI' ? '' : 'hidden'}`}>
                <h2 className="text-xl font-bold mb-4">CHAT with AI</h2>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  <ChatAi problem={problem} />
                </div>
              </div>

            </>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 flex flex-col">
        {/* Right Tabs */}
        <div className="flex bg-base-200 px-2 py-1 border-b border-base-300">
          {[
            { id: 'code', icon: <FaCode className="mr-1" />, label: 'Code' },
            { id: 'testcase', icon: <FaTerminal className="mr-1" />, label: 'Testcase' },
            { id: 'result', icon: <FaPaperPlane className="mr-1" />, label: 'Result' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`flex items-center px-4 py-2 rounded-t-lg transition-all ${
                activeRightTab === tab.id
                  ? 'bg-base-100 text-primary border-t-2 border-primary font-semibold'
                  : 'text-gray-600 hover:bg-base-300'
              }`}
              onClick={() => setActiveRightTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col">
          {activeRightTab === 'code' && (
            <div className="flex-1 flex flex-col">
              {/* Language Selector */}
              <div className="flex justify-between items-center p-3 border-b border-base-300 bg-base-200">
                <div className="flex gap-1">
                  {['javascript', 'java', 'cpp'].map((lang) => (
                    <button
                      key={lang}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        selectedLanguage === lang
                          ? 'bg-primary text-primary-content'
                          : 'bg-base-100 text-base-content hover:bg-base-300'
                      }`}
                      onClick={() => handleLanguageChange(lang)}
                    >
                      {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 relative">
                <div className="absolute inset-0">
                  <Editor
                    key={`editor-${selectedLanguage}`} // Force re-render on language change
                    height="100%"
                    language={getLanguageForMonaco(selectedLanguage)}
                    value={code}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    theme="vs-dark"
                    loading={
                      <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                      </div>
                    }
                    options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    renderLineHighlight: 'line',
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    mouseWheelZoom: true,
                  }}
                  />
                </div>
              </div>

              
              </div>
          )}

          {activeRightTab === 'testcase' && (
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              <h3 className="font-semibold mb-4 text-lg flex items-center">
                <FaTerminal className="mr-2 text-primary" /> Test Results
              </h3>
              {runResult ? (
                <div className={`mb-4 p-4 rounded-lg ${
                  runResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div>
                    {runResult.success ? (
                      <div>
                        <div className="flex items-center text-green-700 font-bold mb-2">
                          <FaCheck className="mr-2 text-xl" /> All test cases passed!
                        </div>
                        <div className="flex gap-4 text-sm mb-4">
                          <div className="bg-green-100 px-3 py-1 rounded-full text-blue-500">
                            <span className="font-medium">Runtime:</span> {runResult.runtime} sec
                          </div>
                          <div className="bg-green-100 px-3 py-1 rounded-full  text-blue-500">
                            <span className="font-medium">Memory:</span> {runResult.memory} KB
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-3">
                          {runResult.testCases.map((tc, i) => (
                            <div key={i} className="bg-base-100 p-3 rounded-lg border border-base-300">
                              <div className="font-mono text-sm">
                                <div className="flex gap-2">
                                  <span className="font-semibold w-24 text-accent">Input:</span>
                                  <span className="flex-1">{tc.stdin}</span>
                                </div>
                                <div className="flex gap-2 mt-1">
                                  <span className="font-semibold w-24 text-accent">Expected:</span>
                                  <span className="flex-1">{tc.expected_output}</span>
                                </div>
                                <div className="flex gap-2 mt-1">
                                  <span className="font-semibold w-24 text-accent">Output:</span>
                                  <span className="flex-1">{tc.stdout}</span>
                                </div>
                                <div className="mt-2 flex items-center text-green-600">
                                  <FaCheck className="mr-1" /> Passed
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center text-red-700 font-bold mb-2">
                          <FaTimes className="mr-2 text-xl" /> Test Cases Failed
                        </div>
                        
                        <div className="mt-4 space-y-3">
                          {runResult.testCases.map((tc, i) => (
                            <div key={i} className={`bg-base-100 p-3 rounded-lg border ${
                              tc.status_id === 3 ? 'border-green-300' : 'border-red-300'
                            }`}>
                              <div className="font-mono text-sm">
                                <div className="flex gap-2">
                                  <span className="font-semibold w-24 text-accent">Input:</span>
                                  <span className="flex-1">{tc.stdin}</span>
                                </div>
                                <div className="flex gap-2 mt-1">
                                  <span className="font-semibold w-24 text-accent">Expected:</span>
                                  <span className="flex-1">{tc.expected_output}</span>
                                </div>
                                <div className="flex gap-2 mt-1">
                                  <span className="font-semibold w-24 text-accent">Output:</span>
                                  <span className="flex-1">{tc.stdout}</span>
                                </div>
                                <div className={`mt-2 flex items-center ${
                                  tc.status_id === 3 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {getStatusIcon(tc.status_id === 3 ? 'Passed' : 'Failed')}
                                  {tc.status_id === 3 ? 'Passed' : 'Failed'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <FaTerminal className="text-4xl mx-auto mb-3 text-gray-300" />
                  <p>Run your code to see test results here</p>
                </div>
              )}
            </div>
          )}

          {activeRightTab === 'result' && (
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              <h3 className="font-semibold mb-4 text-lg flex items-center">
                <FaPaperPlane className="mr-2 text-primary" /> Submission Result
              </h3>
              {submitResult ? (
                <div className={`p-5 rounded-lg ${
                  submitResult.accepted ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {submitResult.accepted ? (
                    <div>
                      <div className="flex items-center text-green-700 font-bold text-xl mb-3">
                        <FaCheck className="mr-2 text-2xl" /> Accepted
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-green-100 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Test Cases</div>
                          <div className="text-xl font-bold text-green-500">
                            {submitResult.passedTestCases}/{submitResult.totalTestCases}
                          </div>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Runtime</div>
                          <div className="text-xl font-bold text-blue-500">{submitResult.runtime} sec</div>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Memory</div>
                          <div className="text-xl font-bold text-blue-500">{submitResult.memory} KB</div>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Status</div>
                          <div className="text-xl font-bold text-green-600">Passed</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center text-red-700 font-bold text-xl mb-3">
                        <FaTimes className="mr-2 text-2xl" /> {submitResult.error}
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-red-100 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Test Cases</div>
                          <div className="text-xl font-bold">
                            {submitResult.passedTestCases}/{submitResult.totalTestCases}
                          </div>
                        </div>
                        <div className="bg-red-100 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Status</div>
                          <div className="text-xl font-bold text-red-600">Failed</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <FaPaperPlane className="text-4xl mx-auto mb-3 text-gray-300" />
                  <p>Submit your code to see results here</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
          <div className="p-3 border-t border-base-300 flex justify-between bg-base-200">
            <div className="flex gap-2">
              <button 
                className="btn btn-sm btn-ghost flex items-center"
                onClick={() => setActiveRightTab('testcase')}
              >
                <FaTerminal className="mr-1" /> Console
              </button>
            </div>
            <div className="flex gap-2">
              <button
                className={`btn btn-outline btn-sm flex items-center ${loading ? 'loading' : ''}`}
                onClick={handleRun}
                disabled={loading}
              >
                <FaPlay className="mr-1" /> Run
              </button>
              <button
                className={`btn btn-primary btn-sm flex items-center ${loading ? 'loading' : ''}`}
                onClick={handleSubmitCode}
                disabled={loading}
              >
                <FaPaperPlane className="mr-1" /> Submit
              </button>
            </div>
          </div>
      </div>
    </div>
  );
};

export default ProblemPage;
