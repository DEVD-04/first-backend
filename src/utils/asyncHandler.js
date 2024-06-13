//use when promise used
const asyncHandler = (requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((error)=> next(error))   //if error occurs then call next with that error

    }
}

export {asyncHandler}


// const asyncHandler =()=>{}
//giving a func as arg
// second () is to execute fn
// const asyncHandler =(fn)=> {
//     async() =>{}
// }
// required form
// const asyncHandler =(fn)=> async(req,res,next) =>{
//     try{
//         await fn(req,res,next)
//     }catch(error){
//         res.status(err.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }