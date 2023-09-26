# DDM-Chatting-app
Hello! I am excited to share that me and my groupmate have successfully developed a secure and versatile chat application. Our application provides users with a seamless messaging experience, offering both private and group messaging options.

With a strong emphasis on user privacy, our application ensures that only known contacts can send messages to users. We believe in empowering our users with control, allowing them to manage their group memberships and decide who can add them to groups.

To enhance the security of our platform, we have implemented multi-factor authentication, requiring users to confirm their email addresses alongside passwords. This additional layer of protection helps safeguard user accounts from unauthorized access.

# Table of Contents
<ul> 
    <li>Getting Started</li>
        <ul> 
            <li>Prerequisites</li>
            <li>Installation</li>
            <li>Usage</li>
        </ul>
    <li>Usage</li>
</ul>

# Getting Started
## Prerequisites
Make sure you have the following software installed on your system:
<ul> 
    <li>Node.js</li>
    <li>MongoDB</li>
</ul>

## Installation
1. Clone the repository:
```bash
    git clone https://github.com/yourusername/course-management-website.git
    cd course-management-website
```
2. Install dependencies:
```bash
    npm install
```
3. Configure environment variables:
Create a `.env` file in the project root and configure the following variables
(Replace your-session-secret with a secure session secret.):
```bash
    MONGODB_URI={local mongodb URI: "mongodb://localhost:27017/blogDB" or online URI such as AWS}
    SESSION_SECRET=your-session-secret
```
4. Start the application:
```bash
    node app.js
```

## Usage
To begin messaging, you must first log in to your account. If you don't have an account, you can create one using your email and password. After entering your email and password, a confirmation email will be sent to the provided email address. Until confirmation, users will not be considered registered.

Once logged in, you can access the chat interface to start messaging with other users. Enjoy the secure and versatile messaging experience our application offers!






