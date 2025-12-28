import React, { useState } from 'react';
import { BookOpen, ChevronRight, Sparkles, Award, CheckCircle } from 'lucide-react';
// @ts-ignore
import EducationalSection from './EducationalSection';

interface Level0Props {
    onBack: () => void;
}

interface Section {
    id: string;
    title: string;
    icon: string;
    color: string;
    content: string;
}

const Level0: React.FC<Level0Props> = ({ onBack }) => {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

    const sections: Section[] = [
        {
            id: 'what-is-testing',
            title: 'What is Software Testing?',
            icon: '🔍',
            color: 'from-blue-500 to-cyan-500',
            content: `Software testing is the process of evaluating and verifying that a software application does what it's supposed to do. Think of it like a quality check before a product hits the shelves!

**Key Points:**
- Identifies bugs and defects before users find them
- Ensures the software meets requirements and specifications
- Validates that the application works as expected
- Similar to proofreading an essay before submitting it

**Real-World Example:**
Imagine you're building a login page. Testing would verify:
- Can users log in with correct credentials? ✓
- Are wrong passwords rejected? ✓
- Does "Forgot Password" work? ✓
- Is the page secure? ✓`
        },
        {
            id: 'need-for-testing',
            title: 'Need for Software Testing',
            icon: '⚡',
            color: 'from-purple-500 to-pink-500',
            content: `Why do we need software testing? Because bugs in production are expensive, embarrassing, and sometimes dangerous!

**Critical Reasons:**
- **Cost Savings**: Finding bugs early is 100x cheaper than fixing them in production
- **User Trust**: One bad experience can lose customers forever
- **Security**: Vulnerabilities can lead to data breaches
- **Compliance**: Many industries require rigorous testing (healthcare, finance)

**Famous Bug Disasters:**
- Mars Climate Orbiter (1999): $327M lost due to unit conversion bug
- Therac-25: Medical device bug caused radiation overdoses
- Knight Capital (2012): Trading bug lost $440M in 45 minutes

Testing prevents disasters! 🛡️`
        },
        {
            id: 'types-of-testing',
            title: 'Types of Software Testing',
            icon: '🎯',
            color: 'from-green-500 to-emerald-500',
            content: `Software testing comes in many flavors! Here are the main types:

**1. Manual Testing**
- Testers manually execute test cases without automation
- Good for: Exploratory testing, usability, ad-hoc scenarios
- Example: Clicking through a website to check user experience

**2. Automation Testing**
- Scripts automatically execute test cases
- Good for: Repetitive tests, regression, large-scale testing
- Example: Running 1000 login tests in 5 minutes

**3. Functional Testing**
- Tests what the software does
- Example: Does the "Add to Cart" button actually add items?

**4. Non-Functional Testing**
- Tests how the software performs
- Includes: Performance, Security, Usability, Compatibility

**5. Black Box vs White Box**
- Black Box: Testing without knowing internal code
- White Box: Testing with knowledge of internal structure`
        },
        {
            id: 'testing-levels',
            title: 'Different Levels of Software Testing',
            icon: '📊',
            color: 'from-orange-500 to-red-500',
            content: `Testing happens at different stages of development. Think of it as layers of quality checks:

**Level 1: Unit Testing** 🔬
- Tests individual components/functions
- Done by: Developers
- Example: Testing a single "calculateTotal()" function

**Level 2: Integration Testing** 🔗
- Tests how components work together
- Done by: Developers/QA
- Example: Does the shopping cart communicate with the payment system?

**Level 3: System Testing** 🖥️
- Tests the complete, integrated system
- Done by: QA Team
- Example: Testing the entire e-commerce website end-to-end

**Level 4: Acceptance Testing** ✅
- Validates the system meets business requirements
- Done by: End users/Clients
- Example: Customer confirms the website works as they requested

Each level catches different types of bugs!`
        },
        {
            id: 'importance',
            title: 'Why is Importance of Software Testing?',
            icon: '⭐',
            color: 'from-indigo-500 to-purple-500',
            content: `Software testing isn't just important—it's CRITICAL for success. Here's why:

**1. Quality Assurance** 💎
- Delivers reliable, high-quality products
- Builds customer confidence and trust
- Reduces negative reviews and complaints

**2. Security** 🔒
- Identifies vulnerabilities before hackers do
- Protects sensitive user data
- Prevents costly security breaches

**3. Cost Efficiency** 💰
- Finding bugs early = cheaper fixes
- Prevents expensive post-release patches
- Reduces customer support costs

**4. Customer Satisfaction** 😊
- Happy users = repeat customers
- Good reviews = more business
- Brand reputation protection

**5. Legal Compliance** ⚖️
- Many industries require certified testing
- Avoid legal issues and fines
- Meet regulatory standards (HIPAA, GDPR, etc.)

**The Bottom Line:**
Testing is an investment that pays for itself many times over!`
        },
        {
            id: 'best-practices',
            title: 'Best Practices for Software Testing',
            icon: '🏆',
            color: 'from-yellow-500 to-orange-500',
            content: `Follow these best practices to become a testing pro:

**1. Start Testing Early** 🚀
- Don't wait until development is done
- "Shift-Left Testing" - test as you build
- Catch bugs when they're easiest to fix

**2. Automate Wisely** 🤖
- Automate repetitive tests
- Keep manual testing for exploratory work
- Don't try to automate everything

**3. Write Clear Test Cases** 📝
- Use descriptive names
- Include expected vs actual results
- Make them reproducible

**4. Test with Real Data** 📊
- Use production-like test data
- Test edge cases and error scenarios
- Don't just test the "happy path"

**5. Continuous Testing** 🔄
- Integrate testing into CI/CD pipeline
- Run automated tests on every code change
- Get fast feedback

**6. Maintain Test Code** 🔧
- Keep tests updated as features change
- Refactor test code like production code
- Remove obsolete tests

**Pro Tip:** Good tests are as valuable as good code!`
        },
        {
            id: 'benefits',
            title: 'Benefits of Software Testing',
            icon: '🎁',
            color: 'from-pink-500 to-rose-500',
            content: `Software testing provides tremendous benefits for everyone involved:

**For Developers** 👨‍💻
- Confidence in code changes
- Faster debugging with automated tests
- Better code quality through TDD (Test-Driven Development)
- Less time fixing production bugs

**For Business** 💼
- Reduced costs and risks
- Faster time to market with confidence
- Better ROI on development investment
- Competitive advantage through quality

**For End Users** 👥
- Reliable, bug-free experience
- Secure applications protecting their data
- Features that actually work as advertised
- Smoother updates and new releases

**For QA Teams** 🧪
- Clear metrics and KPIs
- Automated regression testing saves time
- Focus on exploratory and complex scenarios
- Career growth opportunities

**Measurable Benefits:**
✓ 40-50% reduction in production bugs
✓ 30-40% faster release cycles
✓ 60-70% test automation coverage
✓ 90%+ customer satisfaction

Investing in testing = Investing in success! 🚀`
        }
    ];

    const handleToggleSection = (sectionId: string) => {
        if (expandedSection === sectionId) {
            // Closing the section
            setExpandedSection(null);
        } else {
            // Opening a new section
            setExpandedSection(sectionId);
            // Mark as completed when user expands it
            setCompletedSections(prev => new Set(prev).add(sectionId));
        }
    };

    const progress = (completedSections.size / sections.length) * 100;

    return (
        <div className="max-w-6xl mx-auto">
            <button
                onClick={onBack}
                className="text-purple-300 hover:text-white mb-8 flex items-center space-x-2 transition-colors"
            >
                <ChevronRight className="w-4 h-4 transform rotate-180" />
                <span>Back to levels</span>
            </button>

            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                            <BookOpen className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                Level 0: Testing Fundamentals
                            </h1>
                            <p className="text-purple-100 text-lg">
                                Your journey into software testing begins here
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-white text-sm font-medium">
                                Progress: {completedSections.size} / {sections.length} topics
                            </span>
                            <span className="text-white text-sm font-medium">
                                {Math.round(progress)}%
                            </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 opacity-20">
                    <Sparkles className="w-24 h-24 text-white" />
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6 mb-8">
                <div className="flex items-start space-x-3">
                    <div className="bg-blue-500/20 rounded-lg p-2 mt-1">
                        <Award className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                            How to Use This Guide
                        </h3>
                        <p className="text-purple-200 mb-3">
                            Click on any topic below to expand and learn. Each section contains essential knowledge for your testing journey!
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-purple-300">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span>Click a topic to expand it and mark as complete</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Educational Sections */}
            <div className="space-y-4">
                {sections.map((section, index) => (
                    <EducationalSection
                        key={section.id}
                        section={section}
                        index={index}
                        isExpanded={expandedSection === section.id}
                        isCompleted={completedSections.has(section.id)}
                        onToggle={() => handleToggleSection(section.id)}
                    />
                ))}
            </div>

            {/* Completion Message */}
            {completedSections.size === sections.length && (
                <div className="mt-8 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                        <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                        🎉 Congratulations!
                    </h3>
                    <p className="text-green-200 mb-4">
                        You've completed all Level 0 topics! You now understand the fundamentals of software testing.
                    </p>
                    <button
                        onClick={onBack}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-8 rounded-xl transition-all transform hover:scale-105"
                    >
                        Continue to Level 1 →
                    </button>
                </div>
            )}
        </div>
    );
};

export default Level0;