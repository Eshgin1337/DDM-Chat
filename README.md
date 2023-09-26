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
In order to start messaging, one need to have an account that he or she needs to log in. Then, after adding the correct credentials, there will open a page for chatting.
