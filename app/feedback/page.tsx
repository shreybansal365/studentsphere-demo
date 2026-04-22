'use client';

import { useState } from 'react';
import { db, firebaseDB } from '../../lib/firebase';
import { RadioGroup, RadioGroupItem } from "./../components/ui/radio-group";
import { useId } from "react";
import Navbar from '../components/Navbar';

const FeedbackPage = () => {
    const [feedbackType, setFeedbackType] = useState('');
    const [faculty, setFaculty] = useState('');
    const [category, setCategory] = useState('');
    const [rating, setRating] = useState('');
    const [feedback, setFeedback] = useState('');
    const [anonymous, setAnonymous] = useState(false);
    const id = useId();

    const handleSubmit = async () => {
        try {
            await firebaseDB.addDoc(firebaseDB.collection(db, 'collegeFeedback'), {
                feedbackType,
                faculty: feedbackType === 'Faculty' ? faculty : '',
                category,
                rating,
                feedback,
                anonymous,
                timestamp: new Date()
            });
            alert('Feedback submitted successfully!');
            setFeedbackType('');
            setFaculty('');
            setCategory('');
            setRating('');
            setFeedback('');
            setAnonymous(false);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Failed to submit feedback. Please try again.');
        }
    };

  return (
        <section>
            <Navbar/>
            {/* 
        <div className="flex items-center justify-center h-[84vh] bg-black text-white">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-lg">
                <h2 className="text-2xl font-bold text-center mb-4">College Feedback</h2>
                
                <label className="block mb-2">Feedback Type</label>
                <select 
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                    value={feedbackType} 
                    onChange={(e) => setFeedbackType(e.target.value)}>
                    <option value="">Select feedback type</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Hostel Facilities">Hostel Facilities</option>
                    <option value="Administration">Administration</option>
                    <option value="Library & Resources">Library & Resources</option>
                    <option value="Mess & Food Services">Mess & Food Services</option>
                    <option value="Events & Clubs">Events & Clubs</option>
                    <option value="Sports & Gym">Sports & Gym</option>
                    <option value="Other">Other</option>
                </select>
                
                {feedbackType === 'Faculty' && (
                    <>
                        <label className="block mt-4 mb-2">Select Faculty</label>
                        <select 
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                            value={faculty} 
                            onChange={(e) => setFaculty(e.target.value)}>
                            <option value="">Select a faculty</option>
                            <option value="Prof. A">Prof. A</option>
                            <option value="Prof. B">Prof. B</option>
                            <option value="Prof. C">Prof. C</option>
                        </select>
                    </>
                )}
                
                <label className="block mt-4 mb-2">Feedback Category</label>
                <select 
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}>
                    {feedbackType === 'Faculty' ? (
                        <>
                            <option value="Teaching Quality">Teaching Quality</option>
                            <option value="Course Content">Course Content</option>
                            <option value="Interaction & Guidance">Interaction & Guidance</option>
                            <option value="Others">Others</option>
                        </>
                    ) : (
                        <>
                            <option value="Cleanliness">Cleanliness</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Staff Behavior">Staff Behavior</option>
                            <option value="Rules & Regulations">Rules & Regulations</option>
                            <option value="Other">Other</option>
                        </>
                    )}
                </select>
                
                <fieldset className="space-y-4 mt-4">
                    <legend className="text-sm text-white font-medium leading-none text-foreground">
                        How likely are you to recommend us?
                    </legend>
                    <RadioGroup 
                        className="flex gap-0 -space-x-px rounded-lg shadow-sm shadow-black/5"
                        onValueChange={setRating}
                        value={rating}
                        >
                        {["0", "1", "2", "3", "4", "5"].map((value) => (
                            <label
                                key={value}
                                className="relative flex size-9 flex-1 cursor-pointer flex-col items-center justify-center gap-3 border border-input text-center text-sm font-medium outline-offset-2 transition-colors first:rounded-s-lg last:rounded-e-lg has-[[data-state=checked]]:z-10 has-[[data-disabled]]:cursor-not-allowed has-[[data-state=checked]]:border-ring has-[[data-disabled]]:opacity-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70 bg-gray-600"
                            >
                                <RadioGroupItem
                                    id={`${id}-${value}`}
                                    value={value}
                                    className="sr-only after:absolute after:inset-0"
                                    />
                                {value}
                            </label>
                        ))}
                    </RadioGroup>
                </fieldset>
                <div className="mt-1 flex justify-between text-xs font-medium">
                    <p>
                        <span className="text-base">😡</span> Not likely
                    </p>
                    <p>
                        Very Likely <span className="text-base">😍</span>
                    </p>
                </div>
                
                <label className="block mt-4 mb-2">Your Feedback</label>
                <textarea 
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500" 
                    rows={4} 
                    placeholder="Write your feedback..."
                    value={feedback} 
                    onChange={(e) => setFeedback(e.target.value)}>
                </textarea>
                
                <div className="flex justify-between mt-4">
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">Submit</button>
                </div>
            </div>
        </div>
        */}
        </section>
    );
};

export default FeedbackPage;
