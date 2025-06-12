import { useState, useCallback, useEffect, useRef } from "react";

const useSlug = (delay = 300) => {
  const [slug, setSlug] = useState("");
  const [input, setInput] = useState("");
  const debounceTimer = useRef(null);

  const createSlug = useCallback((title) => {
    let slug = title.toLowerCase();

    // Đổi ký tự có dấu thành không dấu
    slug = slug.replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, "a");
    slug = slug.replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, "e");
    slug = slug.replace(/i|í|ì|ỉ|ĩ|ị/gi, "i");
    slug = slug.replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, "o");
    slug = slug.replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, "u");
    slug = slug.replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, "y");
    slug = slug.replace(/đ/gi, "d");

    // Xóa các ký tự đặc biệt
    slug = slug.replace(
      /\`|\~|\!|\@|\#|\||\$|\%|\^|\&|\*|\(|\)|\+|\=|\,|\.|\/|\?|\>|\<|\'|\"|\:|\;|_/gi,
      ""
    );

    // Đổi khoảng trắng thành gạch ngang
    slug = slug.replace(/ /gi, "-");

    // Đổi nhiều ký tự gạch ngang liên tiếp thành 1 gạch ngang
    slug = slug.replace(/-+/g, "-");

    // Xóa các ký tự gạch ngang ở đầu và cuối
    slug = slug.replace(/^-|-$/g, "");

    setSlug(slug);
  }, []);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      createSlug(input);
    }, delay);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [input, createSlug, delay]);

  return { slug, setInput };
};

export default useSlug;
