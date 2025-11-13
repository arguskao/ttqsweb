/**
 * 課程學員名單 API 端點
 * 處理 /api/v1/courses/:courseId/students 路由
 * 只有課程講師和管理員可以查看
 */

interface Env {
  DATABASE_URL?: string
}

interface Context {
  request: Request
  env: Env
  params: {
    courseId: string
  }
}

export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env, params } = context

  try {
    console.log('[Course Students] 查詢課程學員名單, Course ID:', params.courseId)

    // 驗證 token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, message: '未提供認證 token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const token = authHeader.substring(7)
    let userId: number
    let userType: string

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      userId = payload.userId || payload.user_id || payload.id || payload.sub
      userType = payload.userType || payload.user_type || 'job_seeker'
      
      if (!userId) {
        throw new Error('Token payload missing user id')
      }
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, message: '無效的 token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // 導入 Neon 數據庫
    const { neon } = await import('@neondatabase/serverless')
    const databaseUrl = env.DATABASE_URL
    if (!databaseUrl) {
      console.log('[Course Students] DATABASE_URL 未配置')
      return new Response(
        JSON.stringify({ success: false, message: 'Database URL not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const sql = neon(databaseUrl)
    const courseId = parseInt(params.courseId, 10)

    if (isNaN(courseId)) {
      return new Response(
        JSON.stringify({ success: false, message: '無效的課程 ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    try {
      // 檢查課程是否存在
      const courseResult = await sql`
        SELECT c.*, ia.user_id as instructor_user_id
        FROM courses c
        LEFT JOIN instructor_applications ia ON c.instructor_id = ia.id
        WHERE c.id = ${courseId}
      `

      if (courseResult.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: '課程不存在' }),
          { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      const course = courseResult[0]

      // 權限檢查：只有課程講師或管理員可以查看學員名單
      if (userType !== 'admin' && course.instructor_user_id !== userId) {
        return new Response(
          JSON.stringify({ success: false, message: '您沒有權限查看此課程的學員名單' }),
          { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      // 獲取學員名單
      const students = await sql`
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.phone,
          ce.enrollment_date,
          ce.progress_percentage,
          ce.status,
          ce.completion_date,
          ce.final_score
        FROM course_enrollments ce
        JOIN users u ON ce.user_id = u.id
        WHERE ce.course_id = ${courseId}
        ORDER BY ce.enrollment_date DESC
      `

      console.log('[Course Students] 找到學員:', students.length)

      // 格式化學員資料
      const formattedStudents = students.map((student: any) => ({
        id: student.id,
        email: student.email,
        firstName: student.first_name,
        lastName: student.last_name,
        fullName: `${student.last_name}${student.first_name}`,
        phone: student.phone,
        enrollmentDate: student.enrollment_date,
        progressPercentage: student.progress_percentage || 0,
        status: student.status || 'enrolled',
        completionDate: student.completion_date,
        finalScore: student.final_score
      }))

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            course: {
              id: course.id,
              title: course.title,
              courseType: course.course_type
            },
            students: formattedStudents,
            total: formattedStudents.length
          }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )

    } catch (dbError: any) {
      console.error('[Course Students] 數據庫查詢失敗:', dbError)
      return new Response(
        JSON.stringify({
          success: false,
          message: '數據庫查詢失敗',
          details: dbError.message
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

  } catch (error: any) {
    console.error('[Course Students] 查詢學員名單失敗:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '獲取學員名單失敗',
        details: error.message
      }),
      {
      status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
}

// 處理 OPTIONS 請求（CORS 預檢）
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-CSRF-Token',
      'Access-Control-Max-Age': '86400'
    }
  })
}
