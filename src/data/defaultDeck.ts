import type { FlashcardItem } from '../types/flashcard';

/**
 * Dữ liệu từ vựng TOEIC Reading (5 từ mẫu chuẩn TOEIC).
 * Bạn có thể dán hoặc thêm trực tiếp các phần tử mới vào mảng JSON bên dưới.
 */
export const VOCABULARY_DATA: FlashcardItem[] = [
  {
    id: 1,
    word: 'conduct',
    pos: '(v., n.)',
    example: 'Interviews will be conducted in the week of May 10.',
    exampleTranslation: 'Các buổi phỏng vấn sẽ được tiến hành trong tuần lễ ngày 10 tháng 5.',
    meaning: 'tiến hành, thực hiện; hành vi, sự quản lý',
    collocation: 'conduct a survey[study], conduct a workshop, conduct an inspection',
  },
  {
    id: 2,
    word: 'implement',
    pos: '(v.)',
    example: 'The company plans to implement a new attendance policy next quarter.',
    exampleTranslation: 'Công ty dự định triển khai chính sách chấm công mới vào quý tới.',
    meaning: 'triển khai, thi hành, áp dụng',
    collocation: 'implement a policy, implement changes, implement a strategy',
  },
  {
    id: 3,
    word: 'accommodate',
    pos: '(v.)',
    example: 'The conference hall can accommodate up to 350 guests comfortably.',
    exampleTranslation: 'Hội trường có thể chứa thoải mái lên đến 350 khách mời.',
    meaning: 'chứa được, đáp ứng nhu cầu, thu xếp chỗ ở',
    collocation: 'accommodate a request, accommodate guests, accommodate changes',
  },
  {
    id: 4,
    word: 'comply',
    pos: '(v.)',
    example: 'All contractors must comply with the updated safety regulations.',
    exampleTranslation: 'Tất cả các nhà thầu phải tuân thủ các quy định an toàn mới cập nhật.',
    meaning: 'tuân thủ, chấp hành theo quy định',
    collocation: 'comply with regulations, comply with a request, strictly comply with',
  },
  {
    id: 5,
    word: 'reimburse',
    pos: '(v.)',
    example: 'Employees will be reimbursed for approved travel expenses within ten days.',
    exampleTranslation: 'Nhân viên sẽ được hoàn trả chi phí công tác đã duyệt trong vòng mười ngày.',
    meaning: 'hoàn trả, bồi hoàn chi phí',
    collocation: 'reimburse travel expenses, reimburse for costs, fully reimburse',
  },
];

export const DEFAULT_TOEIC_DECK = VOCABULARY_DATA;
