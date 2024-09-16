class ApiError extends Error {
    constructor(
        statuscode ,
        message= "Something went wrong" ,
        errors = [] ,
        statck = ""
            
    ){
        super(message)
        this.statuscode = statuscode
        this.data = null 
        this.message = message
        this.success = false;
        this.errors = errors

        if(stack) {
            this.stack = statck
        } else {
            error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}