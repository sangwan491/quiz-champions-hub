import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, AlertCircle, Trophy, Clock, Users } from "lucide-react";

const RulesPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there's history to go back to
    if (globalThis.history.length > 1) {
      navigate(-1);
    } else {
      // If no history (e.g., opened in new tab), go to home
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">Rules and Regulations</h1>
          <p className="text-muted-foreground">
            Please read these rules carefully before participating in the Brevo Quiz Challenge
          </p>
        </div>

        <div className="space-y-6">
          {/* General Rules */}
          <Card className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold mb-3">General Rules</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>All participants must register with valid information including name and phone number.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Each participant is allowed to create only one account using their unique phone number.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Participants must be present at React India 2025 to be eligible for prizes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>By registering, you consent to the collection and use of your information for quiz purposes.</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Quiz Format */}
          <Card className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold mb-3">Quiz Format</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The quiz will be conducted during scheduled sessions announced by the administrators.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Each quiz session will have a specific start and end time.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Questions will be multiple-choice with only one correct answer.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Each question may have a time limit set by the administrator.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>You can only participate in active quiz sessions within the scheduled time.</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Scoring System */}
          <Card className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <Trophy className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold mb-3">Scoring System</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Points are awarded for correct answers and deducted for incorrect ones.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Each question has positive points for correct answers and negative points for wrong answers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The total score is calculated based on all attempted questions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Your final score will be displayed on the leaderboard.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>In case of a tie, the participant who completed the quiz faster will rank higher.</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Prizes and Rewards */}
          <Card className="p-6 bg-primary/10 border-primary/30">
            <div className="flex items-start gap-3 mb-4">
              <Trophy className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold mb-3 text-primary">Prizes and Rewards</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Top performers on the leaderboard will be eligible for exciting prizes and rewards.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong className="text-foreground">Winners with complete profiles (email & LinkedIn) will receive maximized prizes and perks.</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Prize distribution will occur at the Brevo booth during React India 2025.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Winners must be present at the event to claim their prizes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Valid contact information (phone number) is required for prize verification and distribution.</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Code of Conduct */}
          <Card className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold mb-3">Code of Conduct</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Participants must answer questions independently without external assistance.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Use of unfair means, cheating, or multiple accounts will result in disqualification.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Any attempt to manipulate the system or scores will lead to immediate removal.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Respect fellow participants and maintain a fair competitive environment.</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Important Notes */}
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold mb-3">Important Notes</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The organizers reserve the right to modify rules and regulations at any time.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>All decisions made by the quiz administrators are final and binding.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Technical issues should be reported immediately to the administrators.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The organizers are not responsible for any technical difficulties faced by participants.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Prizes and rewards will be distributed as per the organizers' discretion.</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Privacy and Data */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-3">Privacy and Data Usage</h2>
            <p className="text-muted-foreground mb-3">
              By participating in this quiz, you agree that:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Your name and score may be displayed publicly on the leaderboard.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Your contact information will be used only for quiz-related communications.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>We respect your privacy and will not share your data with third parties without consent.</span>
              </li>
            </ul>
          </Card>

          {/* Contact */}
          <Card className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Questions or Concerns?</h2>
            <p className="text-muted-foreground">
              If you have any questions about these rules, please contact the quiz administrators at the event.
            </p>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={handleBack}
            className="btn-hero"
            size="lg"
          >
            I Understand
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RulesPage;

