import {
  READER_MATH_BLOCK_TOKEN_TYPE,
  READER_MATH_INLINE_TOKEN_TYPE,
} from "@/features/reader/logic/markdown/constants";
import { READER_MATH_MARKED_EXTENSION } from "@/features/reader/logic/markdown/mathExtension";

const [blockExtension, inlineExtension] = READER_MATH_MARKED_EXTENSION.extensions ?? [];

describe("mathExtension", () => {
  it("detects block-math starts", () => {
    expect(blockExtension.start?.call({} as any, "abc\n$$\n1+2\n$$")).toBe(3);
    expect(blockExtension.start?.call({} as any, "abc\n\\[\n1+2\n\\]")).toBe(3);
    expect(blockExtension.start?.call({} as any, "plain text")).toBeUndefined();
  });

  it("tokenizes block math from dollar and bracket formats", () => {
    const multiline = blockExtension.tokenizer?.call({} as any, "$$\nx+y\n$$\n");
    const singleline = blockExtension.tokenizer?.call({} as any, "$$x+y$$\n");
    const bracket = blockExtension.tokenizer?.call({} as any, "\\[\nx+y\n\\]\n");

    expect(multiline).toMatchObject({ type: READER_MATH_BLOCK_TOKEN_TYPE, expression: "x+y" });
    expect(singleline).toMatchObject({ type: READER_MATH_BLOCK_TOKEN_TYPE, expression: "x+y" });
    expect(bracket).toMatchObject({ type: READER_MATH_BLOCK_TOKEN_TYPE, expression: "x+y" });
    expect(blockExtension.tokenizer?.call({} as any, "not math")).toBeUndefined();
  });

  it("tokenizes inline paren and dollar math and rejects invalid dollar expressions", () => {
    const paren = inlineExtension.tokenizer?.call({} as any, "\\(x+y\\)");
    const dollar = inlineExtension.tokenizer?.call({} as any, "$x+y$");

    expect(paren).toMatchObject({ type: READER_MATH_INLINE_TOKEN_TYPE, expression: "x+y" });
    expect(dollar).toMatchObject({ type: READER_MATH_INLINE_TOKEN_TYPE, expression: "x+y" });
    expect(inlineExtension.tokenizer?.call({} as any, "$$x+y$$")).toBeUndefined();
    expect(inlineExtension.tokenizer?.call({} as any, "$ x+y$")).toBeUndefined();
    expect(inlineExtension.tokenizer?.call({} as any, "$x+y $")).toBeUndefined();
    expect(inlineExtension.tokenizer?.call({} as any, "$x\\$y$")).toMatchObject({
      type: READER_MATH_INLINE_TOKEN_TYPE,
      expression: "x\\$y",
    });
  });

  it("renders math tokens and ignores invalid token shapes", () => {
    const blockHtml = blockExtension.renderer?.call(
      {} as any,
      {
        type: READER_MATH_BLOCK_TOKEN_TYPE,
        raw: "$$x+y$$",
        expression: "x+y",
      } as any,
    );
    const inlineHtml = inlineExtension.renderer?.call(
      {} as any,
      {
        type: READER_MATH_INLINE_TOKEN_TYPE,
        raw: "$x+y$",
        expression: "x+y",
      } as any,
    );
    const invalidHtml = inlineExtension.renderer?.call(
      {} as any,
      {
        type: READER_MATH_INLINE_TOKEN_TYPE,
        raw: "$x+y$",
        expression: 123,
      } as any,
    );

    expect(blockHtml).toContain('class="math-block"');
    expect(inlineHtml).toContain('class="math-inline"');
    expect(invalidHtml).toBe("");
  });

  it("masks math content for emphasis/strong parsing safety", () => {
    const masked = READER_MATH_MARKED_EXTENSION.hooks?.emStrongMask?.call(
      {} as any,
      "A $x+y$ B\n$$\nc+d\n$$ C \\(e+f\\) D \\[g+h\\]",
    );

    expect(masked).toBeDefined();
    expect(masked).not.toContain("x+y");
    expect(masked).not.toContain("c+d");
    expect(masked).not.toContain("e+f");
    expect(masked).not.toContain("g+h");
    expect(masked).toContain("aaaaa");
  });
});
