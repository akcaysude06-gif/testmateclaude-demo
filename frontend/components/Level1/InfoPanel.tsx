import React from 'react';
import { BookOpen, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';

const InfoPanel: React.FC = () => {
    return (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 h-full">
            <div className="flex items-center space-x-3 mb-6">
                <div className="bg-green-500/20 rounded-xl p-3">
                    <BookOpen className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">How It Works</h2>
            </div>

            <div className="space-y-6">
                {/* Step 1 */}
                <div>
                    <div className="flex items-start space-x-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                            1
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-1">Describe Your Test</h3>
                            <p className="text-purple-200 text-sm">
                                Write what you want to test in plain English. Be as detailed as possible.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step 2 */}
                <div>
                    <div className="flex items-start space-x-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                            2
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-1">Upload Test Scenarios (Optional)</h3>
                            <p className="text-purple-200 text-sm">
                                Drag & drop or import test case files for more complex scenarios.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step 3 */}
                <div>
                    <div className="flex items-start space-x-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                            3
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-1">Generate Code</h3>
                            <p className="text-purple-200 text-sm">
                                AI generates professional Selenium Python code based on your description.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step 4 */}
                <div>
                    <div className="flex items-start space-x-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                            4
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-1">Review & Use</h3>
                            <p className="text-purple-200 text-sm">
                                Review the generated code, understand how it works, and use it in your project.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tips Section */}
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 mt-6">
                    <div className="flex items-start space-x-2 mb-3">
                        <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <h4 className="font-semibold text-white">Tips for Better Results</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-purple-200">
                        <li className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span>Include specific URLs and element selectors</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span>Mention expected outcomes clearly</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span>Describe the user flow step by step</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span>Use action verbs (click, enter, verify)</span>
                        </li>
                    </ul>
                </div>

                {/* Example Section */}
                <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4">
                    <div className="flex items-start space-x-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <h4 className="font-semibold text-white">Example Description</h4>
                    </div>
                    <p className="text-sm text-green-200 italic">
                        "Navigate to https://example.com/login, enter username 'testuser' in the username field,
                        enter password 'password123' in the password field, click the 'Sign In' button,
                        and verify that the page redirects to the dashboard."
                    </p>
                </div>

                {/* Powered By */}
                <div className="bg-white/5 rounded-xl p-4 mt-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-purple-300">Powered by</span>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="font-semibold text-white">Llama 3</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfoPanel;