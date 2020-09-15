
Project live on : http://89.107.63.135:3333/


MENTEE SIDE

RES: { request_id: '30696d74424c333539323132', type: 'success' }
RES: { message: 'retry send successfully', type: 'success' }
RES: { message: 'OTP verified success', type: 'success' }

onVerifyAgain message: 'Mobile no. already verified'
onRetryLate   message: 'otp expired'

### (REGISTERATION)
# SendOTP 
POST /mentee/register/api/send-otp
{name,phone,email,password}

{type:success}
{type:failure,err:duplicateMobile}

# ResendOTP 
POST /mentee/register/api/resend-otp
{name,phone,email,password}

{type:success}

# Verify OTP and register 
POST /mentee/register
{name,phone,email,password,otp}

{type:success}


# Complete profile 
PUT /mentee/complete-profile
{}

{result:'success'}

### (LOGIN)
# SendOTP 
POST /mentee/login/api/send-otp
{phone}
{type:success}

# ResendOTP 
POST /mentee/login/api/send-otp 
{phone}
{type:success}
 
# Login (email,password) POST /mentee/login
# Login (phone,password) POST /mentee/phonelogin
# Login (phone,otp) POST /mentee/otplogin




### (AFTER LOGIN i.e. Protected)

# Quote - Fetch quote of the day 
GET /mentee/dashboard/quote
{quote:"Lorem ipsum lorem xyz",by:"Robert Kiyosaki"}

# Mentor - Fetch mentor details  
GET /mentee/dashboard/my-mentor-details
{mentorName,mentorPhone,mentorEmail,mentorId,mentorImage}

Request material
## Submit material Request
    POST /mentee/dashboard/material-requests 
    {requests:["p-cb-th","m-st-fs"]}
    
    {result:'success'}

## View past requests
    GET /mentee/dashboard/past-material-requests 

    {
        "pastrequests": [
            {
            "requestid": "reqid",
                "material": [
                    "p-cb-th",
                    "m-st-fs"
                ],
            "status": "1"
            },
            {
            "requestid": "reqid",
                "material": [
                    "p-cb-th",
                    "m-st-fs"
                ],
            "status": "1"
            }
        ]
    }

### Library/Material
# Get token validity 1hr
    POST /mentee/library/get-access-token
    {material:"p-cb-th"}
    
    {result:'success',token:'jwtxyztoken123'} 

# view material pdf
    GET /mentee/library/material/view?token=jwtxyztoken123

# download pdf
    GET /mentee/library/material/download?token=jwtxyztoken123

Notification
    -fetch all
    -delete a specific Notification
    -mark as read

Help and support
# add new ticket
POST /mentee/helpdesk/new-ticket
{subject,description}

{result:'success',ticketid:'tkt123'}

# past tickets
GET /mentee/helpdesk/past-tickets 
{
    "pasttickets": [
        {
            "tickettime": "timestamp",
            "ticketid": "ticketid",
            "subject": "billing",
            "description": "my issue is xyz",
            "status": "pending"
        },
        {
            "tickettime": "timestamp",
            "ticketid": "ticketid",
            "subject": "billing",
            "description": "my issue is xyz",
            "status": "pending"
        }
    ]
}

Feedback- Submit Feedback
POST /mentee/submit-feedback
REVIEW { allfields}

{result:'success'}

Account
# Change password
PUT /mentee/account/change-password
{oldPassword,newPassword}

{result:'success'}
{reslut:'failed',msg:'Old password is not correct'}

# Reset password
POST /mentee/account/reset-password
{email}

{result:'success',msg:'Reset link has been send to your email'}

# Payment History
GET mentee/account/payment-history

{
    "payments": [{
            "invoiceid": "random",
            "paymentdate": "date",
            "status": "success",
            "id": "id",
            "plan": "nameofplan",
            "amount": 1500
        },
        {
            "invoiceid": "random",
            "paymentdate": "date",
            "status": "success",
            "id": "id",
            "plan": "nameofplan",
            "amount": 1500
        }
    ]
}

# Membership details
GET mentee/account/membership
"account": {
        "plan": "planname",
        "expires": "upto"
}

Verification
# isEmailVerified
# isProfileComplete



