/**
 * 課程訊息 API 端點
 * 處理 /api/v1/courses/:courseId/messages 路由
 * 講師可以發送訊息給學員，學員可以查看收到的訊息
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

// GET - 獲取課程訊息列表
export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env, params } = context

  try {
    console.log('[Course Messages] 查詢課程訊息, Course ID:', params.courseId)

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

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      userId = payload.userId || payload.user_id || payload.id || payload.sub
      
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
      // 獲取用戶收到的訊息（包括群發訊息）
      const messages = await sql`
        SELECT 
          cm.*,
          sender.first_name as sender_first_name,
          sender.last_name as sender_last_name,
          sender.email as sender_email
        FROM course_messages cm
        JOIN users sender ON cm.sender_id = sender.id
        WHERE cm.course_id = ${courseId}
          AND (cm.recipient_id = ${userId} OR cm.is_broadcast = TRUE)
        ORDER BY cm.created_at DESC
      `

      console.log('[Course Messages] 找到訊息:', messages.length)

      const formattedMessages = messages.map((msg: any) => ({
        id: msg.id,
        courseId: msg.course_id,
        senderId: msg.sender_id,
        senderName: `${msg.sender_last_name}${msg.sender_first_name}`,
        senderEmail: msg.sender_email,
        recipientId: msg.recipient_id,
        subject: msg.subject,
        message: msg.message,
        isBroadcast: msg.is_broadcast,
        isRead: msg.is_read,
        createdAt: msg.created_at,
        readAt: msg.read_at
      }))

      return new Response(
        JSON.stringify({
          success: true,
          data: formattedMessages
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )

    } catch (dbError: any) {
      console.error('[Course Messages] 數據庫查詢失敗:', dbError)
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
    console.error('[Course Messages] 查詢訊息失敗:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '獲取訊息失敗',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
}

// POST - 發送訊息
export async function onRequestPost(context: Context): Promise<Response> {
  const { request, env, params } = context

  try {
    console.log('[Course Messages] 發送課程訊息, Course ID:', params.courseId)

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

    const body = await request.json() as any
    const { subject, message, recipientId, isBroadcast } = body

    // 驗證必填欄位
    if (!subject || !message) {
      return new Response(
        JSON.stringify({ success: false, message: '主旨和訊息內容為必填' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    try {
      // 檢查課程是否存在，並驗證權限
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

      // 權限檢查：只有課程講師或管理員可以發送訊息
      if (userType !== 'admin' && course.instructor_user_id !== userId) {
        return new Response(
          JSON.stringify({ success: false, message: '您沒有權限發送此課程的訊息' }),
          { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      // 如果是群發訊息
      if (isBroadcast) {
        // 獲取所有學員
        const students = await sql`
          SELECT user_id
          FROM course_enrollments
          WHERE course_id = ${courseId}
        `

        if (students.length === 0) {
          return new Response(
            JSON.stringify({ success: false, message: '此課程目前沒有學員' }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        // 為每個學員創建一條訊息記錄
        const insertPromises = students.map((student: any) =>
          sql`
            INSERT INTO course_messages (
              course_id, sender_id, recipient_id, subject, message, is_broadcast
            ) VALUES (
              ${courseId}, ${userId}, ${student.user_id}, ${subject}, ${message}, TRUE
            )
          `
        )

        await Promise.all(insertPromises)

        return new Response(
          JSON.stringify({
            success: true,
            message: `訊息已發送給 ${students.length} 位學員`,
            data: { recipientCount: students.length }
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
        )
      } else {
        // 單獨發送給特定學員
        if (!recipientId) {
          return new Response(
            JSON.stringify({ success: false, message: '請指定收件人' }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        // 驗證收件人是否為該課程的學員
        const enrollmentCheck = await sql`
          SELECT id
          FROM course_enrollments
          WHERE course_id = ${courseId} AND user_id = ${recipientId}
        `

        if (enrollmentCheck.length === 0) {
          return new Response(
            JSON.stringify({ success: false, message: '收件人不是此課程的學員' }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }

        // 創建訊息
        const result = await sql`
          INSERT INTO course_messages (
            course_id, sender_id, recipient_id, subject, message, is_broadcast
          ) VALUES (
            ${courseId}, ${userId}, ${recipientId}, ${subject}, ${message}, FALSE
          )
          RETURNING *
        `

        return new Response(
          JSON.stringify({
            success: true,
            message: '訊息已發送',
            data: result[0]
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
        )
      }

    } catch (dbError: any) {
      console.error('[Course Messages] 數據庫操作失敗:', dbError)
      return new Response(
        JSON.stringify({
          success: false,
          message: '數據庫操作失敗',
          details: dbError.message
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

  } catch (error: any) {
    console.error('[Course Messages] 發送訊息失敗:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '發送訊息失敗',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-CSRF-Token',
      'Access-Control-Max-Age': '86400'
    }
  })
}
