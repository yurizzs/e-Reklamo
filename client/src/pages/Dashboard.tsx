import { useState } from "react";
import MainLayout from "../components/layouts/MainLayout";
import { ToastProvider, Button, Image } from "../components/ui/index";
import { notify } from "../util/notify";
import { 
  InputField, PasswordInputField, Checkbox, 
  Radio, Select, MultiSelect, FileUploadField,
  TextArea
} 
from "../components/ui/forms/index";

// EXAMPLE IMAGE
import HeroImage from '../assets/hero.png';

const Dashboard = () => {

  const handleToggleNotification = () => {
    notify.info("Info Message")
    notify.success("Success Message")
    notify.warning("Warning Message")
    notify.error("Error Message")
  };

  const fakeApiCall = () =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve("Success!") : reject("Error!");
      }, 2000);
  });

  const handlePromiseNotification = () => {
    notify.promise(fakeApiCall(), {
      loading: "Processing...",
      success: "Operation successful!",
      error: "Something went wrong!",
    });
  };
  
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingButton = async () => {
    setIsLoading(true);
    try {
      const result = await fakeApiCall();
      notify.success(`${result}`);
    } catch (error) {
      notify.error(`${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const [roles, setRoles] = useState<string[]>([]);

  const handleFileSelect = (selectedFiles: File[]) => {
    console.log('Selected files:', selectedFiles);
  };

  const [textArea, setTextArea] = useState('');

  const content = (
    <>
      <div className="space-y-12 pb-20">
        
        {/* Buttons & Notification */}
        <h1 className="text-text">
          Button & Toast Notification Usage Examples
        </h1>

        {/* 🔔 Notification Trigger Example */}
        <div className="flex gap-3">

          <Button type="button" variant="primary" onClick={handleToggleNotification} iconName="FaBell">
            Toggle Notification
          </Button>

          <Button type="button" variant="secondary" iconName="FaPlay"
            onClick={handlePromiseNotification}>
            Run Promise Toast
          </Button>

        </div>

        {/* 🚀 Button Component Examples */}
        <div className="space-y-4">

          <div className="flex flex-wrap gap-4">

            {/* 2️⃣ Primary Button with Tooltip */}
            <Button type="button" variant="primary" tooltip="With Tooltips" tooltipPosition="bottom">
              Primary With Tooltip
            </Button>

            <Button type="button" variant="secondary">
              Secondary
            </Button>

            {/* 1️⃣ Button without icon */}
            <Button type="button" variant="danger">
              Simple Button
            </Button>

            {/* 2️⃣ Button with icon */}
            <Button type="button" variant="outline" iconName="FaBell">
              With Icon
            </Button>

            {/* 3️⃣ Button with loading spinner */}
            <Button
              type="button"
              variant="ghost"
              isLoading={isLoading}
              loadingText="Submitting..."
              iconName="FaCloudArrowUp"
              onClick={handleLoadingButton}>
              Submit
            </Button>

          </div>

        </div>

        {/* Forms */}

        <div className="space-y-12 pb-20">
          <h1 className="text-text">Forms</h1>
          <div className="flex flex-col space-x-4 gap-3">

            <InputField
              label="Email" 
              name="email"
              type="email"
              placeholder="Enter your email"
              iconName="FaEnvelope"
              required
              error="test"
            />

            <PasswordInputField
              label="Password"
              name="password"
              placeholder="Enter your password"
              error="Password doesn ot match"
            />
            
            <Checkbox
              label="Is Enroll"
              name="status"
            />

            <div className="inline-flex gap-3">
              <Radio name="gender" label="Male"/>
              <Radio name="gender" label="Female"/>
            </div>

            <Select
              name="programming_languages"
              label="Programming Languages"
              iconName="FaLanguage"
              required
              error="Programming Language is required"
              options={[
                {
                  value: "python",
                  label: "Python",
                },
                {
                  value: "C",
                  label: "C",
                },
                {
                  value: "php",
                  label: "PHP",
                }
              ]}
            />

            <MultiSelect
              label="Roles"
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'teacher', label: 'Teacher' },
              ]}
              selectedValues={roles}
              onChange={setRoles}
              iconName="FaUsers"
            />

            <FileUploadField
              label="Avatar"
              name="files"
              accept="image/jpg,jpeg,png"
              onFileSelect={handleFileSelect}
            />

            <FileUploadField
              label="Images"
              name="files"
              maxFiles={2}
              multiple
              accept="image/jpg,jpeg,png"
              onFileSelect={handleFileSelect}
            />

            <TextArea
              label="Message"
              value={textArea}
              onChange={(e) => setTextArea(e.target.value)}
              showCounter
              maxLength={200}
            />

          </div>
        </div>

        {/*  IMAGE COMPONENT USAGES */}
        <div className="space-y-4">
          <h1 className="text-text">Image Component Example Usage</h1>
          
          <Image 
            src={HeroImage} 
            alt="Hero Image"
            size="md"
          />

          <Image 
            src={HeroImage}
            customSize="w-40 h-60" 
          />

          <Image 
            src={HeroImage} 
            customSize="w-[180px] h-[250px]" 
          />

          <Image 
            src={HeroImage}
            alt="Hero Image"
            customSize="w-full"
            aspectRatio="aspect-[16/9]"
          />

          <Image 
            src="/images/user.jpg"
            size="md"
            className="rounded-full"
          />

          <Image 
            src="/images/user.jpg"
            size="md"
            className="rounded-full"
            fallbackIcon="FaUser"
          />

        </div>

      </div>

      <ToastProvider />
    </>
  );

  return <MainLayout content={content} />;
};

export default Dashboard;